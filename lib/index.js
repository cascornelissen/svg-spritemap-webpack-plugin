const fs = require('fs');
const path = require('path');
const glob = require('glob');
const svgo = require('svgo');
const mkdirp = require('mkdirp');
const loaderUtils = require('loader-utils');
const { RawSource } = require('webpack-sources');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');

// Helpers
const generateSVG = require('./generate-svg');
const generateStyles = require('./generate-styles');
const { stripVariables, findVariables } = require('./variable-parser');
const formatOptions = require('./options-formatter');

// Errors & Warnings
const {
    VariablesNotSupportedInLanguageWarning
} = require('./errors');

const plugin = {
    name: 'SVGSpritemapPlugin'
};

module.exports = class SVGSpritemapPlugin {
    constructor(pattern, options = {}) {
        this.options = formatOptions(pattern, options);

        // Dependencies
        this.files = [];
        this.directories = [];
    }

    apply(compiler) {
        compiler.hooks.entryOption.tap(plugin, (context, entry) => {
            const { output: outputOptions } = this.options;

            if ( !outputOptions.svg4everybody ) {
                return;
            }

            // This is a little hacky but there's no other way since Webpack
            // doesn't support virtual files (https://github.com/rmarscher/virtual-module-webpack-plugin)
            const helper = {
                file: fs.readFileSync(path.join(__dirname, 'templates/svg4everybody.template.js'), 'utf8'),
                path: path.join(__dirname, '../svg4everybody-helper.js')
            };

            // Write the helper file to disk
            fs.writeFileSync(helper.path, helper.file.replace('/* PLACEHOLDER */', JSON.stringify(outputOptions.svg4everybody)), 'utf8');

            // Append helper to entry
            const applyEntryPlugin = (entries, name = 'main') => {
                const plugin = new MultiEntryPlugin(context, entries, name);
                plugin.apply(compiler);
            };

            if ( typeof entry === 'string' ) {
                applyEntryPlugin([entry, helper.path]);
            } else if ( Array.isArray(entry) ) {
                if ( !entry.includes(helper.path) ) {
                    applyEntryPlugin([...entry, helper.path]);
                }
            } else if ( typeof entry === 'object' && entry !== null ) {
                Object.keys(entry).forEach((name) => {
                    if ( typeof entry[name] === 'string' ) {
                        applyEntryPlugin([entry[name], helper.path], name);
                    } else if ( Array.isArray(entry[name]) ) {
                        if ( !entry[name].includes(helper.path) ) {
                            applyEntryPlugin([...entry[name], helper.path], name);
                        }
                    } else {
                        throw new Error(`Unsupported sub-entry type for svg4everybody helper: '${typeof entry[name]}'`);
                    }
                });
            } else {
                throw new Error(`Unsupported entry type for svg4everybody helper: '${typeof entry}'`);
            }

            return true;
        });

        // Update dependencies when needed
        compiler.hooks.environment.tap(plugin, this.updateDependencies.bind(this));
        compiler.hooks.watchRun.tap(plugin, this.updateDependencies.bind(this));

        // Generate spritemap
        compiler.hooks.make.tap(plugin, (compilation) => {
            const { sprite: spriteOptions } = this.options;
            const spritemap = generateSVG(this.files, spriteOptions);

            if ( !spritemap ) {
                return;
            }

            // Generate styles
            const { styles, stylesType } = (() => {
                const { styles: stylesOptions } = this.options;

                if ( !stylesOptions ) {
                    return {};
                }

                const extension = path.extname(stylesOptions.filename).substring(1).toLowerCase();
                const styles = generateStyles(spritemap, {
                    extension: extension,
                    prefix: spriteOptions.prefix,
                    variables: stylesOptions.variables
                });

                // Emit a warning when variables are detected while the language doesn't support it
                if ( !['scss', 'sass'].includes(extension) && findVariables(spritemap) ) {
                    compilation.warnings.push(new VariablesNotSupportedInLanguageWarning(extension));
                }

                // Include warnings received from the style formatters
                if ( styles.warnings.length ) {
                    compilation.warnings = [...compilation.warnings, ...styles.warnings];
                }

                // Write the styles file before compilation starts to make sure the files
                // are written to disk before other plugins/loaders (e.g. extract-text-webpack-plugin) can use them
                const stylesType = this.getStylesType(styles.content, stylesOptions.filename);
                this.writeStylesToDisk(styles.content, stylesType);

                return {
                    styles,
                    stylesType
                };
            })();

            // Add a chunk when required
            compilation.hooks.optimizeChunksAdvanced.tap(plugin, () => {
                const { output: outputOptions } = this.options;

                if ( !spritemap ) {
                    return;
                }

                compilation.addChunk(outputOptions.chunk.name);
            });

            // Overwrite the spritemap chunk hash to the custom SVG contenthash to make sure
            // webpack notices the changes and prints the stats output again
            compilation.hooks.chunkHash.tap(plugin, (chunk, chunkHash) => {
                const { output: outputOptions } = this.options;

                if ( chunk.name !== outputOptions.chunk.name || !spritemap ) {
                    return;
                }

                chunkHash.digest = () => this.getContentHash(spritemap);
            });

            // Add (unoptimized) spritemap as asset
            compilation.hooks.additionalChunkAssets.tap(plugin, () => {
                const { output: outputOptions, styles: stylesOptions } = this.options;
                compilation.assets[outputOptions.filename] = new RawSource(spritemap);

                if ( typeof styles !== 'undefined' && stylesType === 'asset' ) {
                    compilation.assets[stylesOptions.filename] = new RawSource(styles.content);
                }

                // Add the filename to the source chunk
                const sourceChunk = compilation.namedChunks.get(outputOptions.chunk.name);
                sourceChunk.files.push(outputOptions.filename);
            });

            // Optimize spritemap SVG/filename
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                const { output: outputOptions } = this.options;

                // Strip variables from spritemap SVG
                const stripped = stripVariables(compilation.assets[outputOptions.filename].source());
                compilation.assets[outputOptions.filename] = new RawSource(stripped);

                // Rewrite the source chunk files hashes
                const hashes = this.getSpritemapHashes(compilation);
                const sourceChunk = compilation.namedChunks.get(outputOptions.chunk.name);
                sourceChunk.files = sourceChunk.files.map((filename) => {
                    if ( filename !== outputOptions.filename ) {
                        return filename;
                    }

                    return this.hashFilename(filename, hashes);
                });

                // Rewrite the compilation.assets hashes for the spritemap asset
                const hashedAssets = this.rewriteAssetsHashes(outputOptions.filename, compilation.assets, hashes);
                compilation.assets = hashedAssets.assets;

                if ( outputOptions.svgo === false ) {
                    return callback();
                }

                const SVGOptimizer = new svgo(outputOptions.svgo);
                SVGOptimizer.optimize(assets[hashedAssets.filename].source()).then((output) => {
                    // Update the optimized asset based on the hashed filename
                    compilation.assets[hashedAssets.filename] = new RawSource(output.data);

                    return callback();
                });
            });

            // Optimize styles filename
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                const { styles: stylesOptions } = this.options;

                if ( typeof styles === 'undefined' || stylesType !== 'asset' ) {
                    return callback();
                }

                // Rewrite the compilation.assets hashes for the styles asset
                const hashedAssets = this.rewriteAssetsHashes(stylesOptions.filename, compilation.assets, this.getStylesHashes(compilation));

                // Update the compilation assets with the hashed ones
                compilation.assets = hashedAssets.assets;

                return callback();
            });
        });

        // Clean up the spritemap chunk
        compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
            const { output: outputOptions } = this.options;

            if ( outputOptions.chunk.keep ) {
                return callback();
            }

            compilation.chunks.forEach((chunk) => {
                if ( chunk.name !== outputOptions.chunk.name ) {
                    return;
                }

                delete compilation.assets[chunk.files[0]];
            });

            return callback();
        });

        // Add context dependencies to webpack compilation to make sure watching works correctly
        compiler.hooks.afterCompile.tap(plugin, (compilation) => {
            this.directories.forEach((directory) => {
                compilation.contextDependencies.add(directory);
            });
        });
    }

    updateDependencies() {
        const { input: inputOptions } = this.options;

        this.files = inputOptions.patterns.reduce((accumulator, value) => {
            const files = glob.sync(value, inputOptions.options).map((file) => {
                return path.resolve(file);
            });

            if ( !files.length ) {
                return accumulator;
            }

            // Transform to Set temporarily to remove duplicates
            return [...new Set(accumulator.concat(files))];
        }, []);

        this.directories = inputOptions.patterns.reduce((accumulator, value) => {
            const directories = glob.sync(`${value.substring(0, value.lastIndexOf('/'))}/`, inputOptions.options).map((directory) => {
                return path.resolve(directory);
            });

            if ( !directories.length ) {
                return accumulator;
            }

            // Transform to Set temporarily to remove duplicates
            return [...new Set(accumulator.concat(directories))];
        }, []);
    }

    getStylesType(styles, filename = '') {
        if ( !styles || !filename ) {
            return;
        }

        if ( path.parse(filename).dir ) {
            return 'dir';
        }

        if ( filename.startsWith('~') ) {
            return 'module';
        }

        return 'asset';
    }

    writeStylesToDisk(styles, type) {
        const { styles: stylesOptions } = this.options;

        const location = {
            'dir': stylesOptions.filename,
            'module': path.resolve(__dirname, '../', stylesOptions.filename.replace('~', ''))
        }[type];

        if ( typeof location === 'undefined' ) {
            return;
        }

        // check is location exist
        const locationExists = fs.existsSync(location);

        // Make sure we don't rewrite the file when it's correct already
        const contents = locationExists && fs.readFileSync(location, 'utf8');
        if ( contents === styles ) {
            return;
        }

        if ( type === 'dir' && !locationExists ) {
            const dirname = path.dirname(location);

            if ( !fs.existsSync(dirname) ) {
                mkdirp.sync(dirname);
            }
        }

        fs.writeFileSync(location, styles, 'utf8');
    }

    rewriteAssetsHashes(filename, assets = {}, hashes = []) {
        if ( !filename || !Object.keys(assets).length || !hashes.length ) {
            return;
        }

        // Update patterns in original filename with hash values accordingly
        const hashedFilename = this.hashFilename(filename, hashes);

        // Update the assets when the filename contained hashes
        if ( hashedFilename !== filename ) {
            assets[hashedFilename] = assets[filename];
            delete assets[filename];
        }

        // Return the resulting (hashed) filename together with the assets
        return {
            filename: hashedFilename,
            assets: assets
        };
    }

    hashFilename(filename, hashes = []) {
        if ( !hashes.length ) {
            return;
        }

        return hashes.reduce((output, hash) => {
            const pattern = new RegExp(hash.pattern, 'ig');
            return output.replace(pattern, hash.value);
        }, filename);
    }

    getSpritemapHashes(compilation) {
        const { output: outputOptions } = this.options;

        if ( !compilation ) {
            return [];
        }

        return [{
            pattern: /\[hash]/,
            value: compilation.getStats().hash
        }, {
            pattern: /\[contenthash]/,
            value: this.getContentHash(compilation.assets[outputOptions.filename].source())
        }];
    }

    getStylesHashes(compilation) {
        const { styles: stylesOptions } = this.options;

        if ( !compilation ) {
            return [];
        }

        return [{
            pattern: /\[hash]/,
            value: compilation.getStats().hash
        }, {
            pattern: /\[contenthash]/,
            value: this.getContentHash(compilation.assets[stylesOptions.filename].source())
        }];
    }

    getContentHash(source) {
        return loaderUtils.getHashDigest(source, 'sha1', 'hex', 16);
    }
};
