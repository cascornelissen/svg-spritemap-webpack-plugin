const fs = require('fs');
const get = require('get-value');
const path = require('path');
const glob = require('glob');
const svgo = require('svgo');
const merge = require('webpack-merge');
const loaderUtils = require('loader-utils');
const isPlainObject = require('is-plain-object');
const { RawSource } = require('webpack-sources');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
const generateSVG = require('./generate-svg');
const generateStyles = require('./generate-styles');

const plugin = {
    name: 'SVGSpritemapPlugin'
};

module.exports = class SVGSpritemapPlugin {
    constructor(options) {
        if ( typeof options !== 'undefined' && !isPlainObject(options) ) {
            throw new Error(`${plugin.name} options should be an object`);
        }

        // Make sure the SVGO cleanupIDs plugin is not being overwritten
        if ( [].concat(...get(options, 'svgo.plugins', { default: [] }).map((plugins) => Object.keys(plugins))).includes('cleanupIDs') ) {
            throw new Error('The SVGO cleanupIDs plugin can not be overwritten as the id attributes are required for spritemaps');
        }

        this.options = merge({
            src: '**/*.svg',
            filename: 'spritemap.svg',
            prefix: 'sprite-',
            gutter: 2,
            styles: false,
            svg4everybody: false,
            svgo: true,
            glob: {},
            chunk: 'spritemap',
            deleteChunk: true,
            generateTitle: true
        }, options);

        // Sanitize options
        if ( typeof this.options.src === 'string' ) {
            this.options.src = [this.options.src];
        }

        if ( this.options.svgo === true ) {
            this.options.svgo = {};
        }

        if ( this.options.svgo ) {
            this.options.svgo = merge({
                plugins: [{
                    cleanupIDs: false
                }]
            }, this.options.svgo);
        }

        if ( this.options.styles === false ) {
            this.options.styles = '';
        }

        if ( this.options.prefix === false ) {
            this.options.prefix = '';
        }

        if ( this.options.svg4everybody === true ) {
            this.options.svg4everybody = {};
        }

        // Dependencies
        this.files = [];
        this.directories = [];
    }

    apply(compiler) {
        compiler.hooks.entryOption.tap(plugin, (context, entry) => {
            if ( !this.options.svg4everybody ) {
                return;
            }

            // This is a little hacky but there's no other way since Webpack
            // doesn't support virtual files (https://github.com/rmarscher/virtual-module-webpack-plugin)
            const helper = {
                file: fs.readFileSync(path.join(__dirname, 'templates/svg4everybody.template.js'), 'utf8'),
                path: path.join(__dirname, '../svg4everybody-helper.js')
            }

            // Write the helper file to disk
            fs.writeFileSync(helper.path, helper.file.replace('/* PLACEHOLDER */', JSON.stringify(this.options.svg4everybody)), 'utf8');

            // Append helper to entry
            const applyEntryPlugin = (entries, name = 'main') => {
                const plugin = new MultiEntryPlugin(context, entries, name);
                plugin.apply(compiler);
            }

            if ( typeof entry === 'string' ) {
                applyEntryPlugin([entry, helper.path]);
            } else if ( Array.isArray(entry) ) {
                if ( !entry.includes(helper.path) ) {
                    applyEntryPlugin([...entry, helper.path]);
                }
            } else if ( isPlainObject(entry) ) {
                Object.keys(entry).forEach((name) => {
                    if ( typeof entry[name] === 'string' ) {
                        applyEntryPlugin([entry[name], helper.path], name);
                    } else if ( Array.isArray(entry[name]) ) {
                        if ( !entry[name].includes(helper.path) ) {
                            applyEntryPlugin([...entry[name], helper.path], name);
                        }
                    } else {
                        throw new Error(`Unsupported sub-entry type for svg4everybody helper: ${typeof entry[name]}`);
                    }
                });
            } else {
                throw new Error(`Unsupported entry type for svg4everybody helper: ${typeof entry}`);
            }

            return true;
        });

        // Update dependencies when needed
        compiler.hooks.environment.tap(plugin, this.updateDependencies.bind(this));
        compiler.hooks.watchRun.tap(plugin, this.updateDependencies.bind(this));

        // Generate spritemap
        compiler.hooks.make.tap(plugin, (compilation) => {
            const spritemap = generateSVG(this.files, {
                prefix: this.options.prefix,
                gutter: this.options.gutter
            });

            if ( !spritemap ) {
                return;
            }

            // Generate styles
            const styles = generateStyles(spritemap, {
                extension: path.extname(this.options.styles).substring(1).toLowerCase(),
                prefix: this.options.prefix
            });

            // Write the styles file before compilation starts to make sure the files
            // are written to disk before other plugins/loaders (e.g. extract-text-webpack-plugin) can use them
            const stylesType = this.getStylesType(styles, this.options.styles);
            this.writeStylesToDisk(styles, stylesType);

            // Add a chunk when required
            compilation.hooks.optimizeChunksAdvanced.tap(plugin, () => {
                if ( !spritemap ) {
                    return;
                }

                compilation.addChunk(this.options.chunk);
            });

            // Overwrite the spritemap chunk hash to the custom SVG contenthash to make sure
            // webpack notices the changes and prints the stats output again
            compilation.hooks.chunkHash.tap(plugin, (chunk, chunkHash) => {
                if ( chunk.name !== this.options.chunk || !spritemap ) {
                    return;
                }

                chunkHash.digest = () => this.getContentHash(spritemap);
            });

            // Add (unoptimized) spritemap as asset
            compilation.hooks.additionalChunkAssets.tap(plugin, () => {
                compilation.assets[this.options.filename] = new RawSource(spritemap);

                if ( stylesType === 'asset' ) {
                    compilation.assets[this.options.styles] = new RawSource(styles);
                }

                // Add the filename to the source chunk
                const sourceChunk = compilation.namedChunks.get(this.options.chunk);
                const hashedFilename = this.hashFilename(this.options.filename, this.getSpritemapHashes(compilation));

                sourceChunk.files.push(hashedFilename);
            });

            // Optimize spritemap SVG/filename when needed
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                // Rewrite the compilation.assets hashes for the spritemap asset
                const hashedAssets = this.rewriteAssetsHashes(this.options.filename, compilation.assets, this.getSpritemapHashes(compilation));

                // Update the compilation assets with the hashed ones
                compilation.assets = hashedAssets.assets;

                if ( this.options.svgo === false ) {
                    return callback();
                }

                const SVGOptimizer = new svgo(this.options.svgo);
                SVGOptimizer.optimize(assets[hashedAssets.filename].source()).then((output) => {
                    // Update the optimized asset based on the hashed filename
                    compilation.assets[hashedAssets.filename] = new RawSource(output.data);

                    return callback();
                });
            });

            // Optimize styles filename
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                if ( stylesType !== 'asset' ) {
                    return callback();
                }

                // Rewrite the compilation.assets hashes for the styles asset
                const hashedAssets = this.rewriteAssetsHashes(this.options.styles, compilation.assets, this.getStylesHashes(compilation));

                // Update the compilation assets with the hashed ones
                compilation.assets = hashedAssets.assets;

                return callback();
            });
        });

        // Clean up the spritemap chunk
        compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
            if ( !this.options.deleteChunk ) {
                return callback();
            }

            compilation.chunks.forEach((chunk) => {
                if ( chunk.name !== this.options.chunk ) {
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
        this.files = this.options.src.reduce((accumulator, value) => {
            const files = glob.sync(value, this.options.glob).map((file) => path.resolve(file));
            if ( !files.length ) {
                return accumulator;
            }

            // Transform to Set temporarily to remove duplicates
            return [...new Set(accumulator.concat(files))];
        }, []);

        this.directories = this.options.src.reduce((accumulator, value) => {
            const directories = glob.sync(`${value.substring(0, value.lastIndexOf('/'))}/`).map((directory) => path.resolve(directory));
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
        const location = {
            'dir': this.options.styles,
            'module': path.resolve(__dirname, '../', this.options.styles.replace('~', ''))
        }[type];

        if ( typeof location === 'undefined' ) {
            return;
        }

        // Make sure we don't rewrite the file when it's correct already
        const contents = fs.existsSync(location) && fs.readFileSync(location, 'utf8');
        if ( contents === styles ) {
            return;
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
        if ( !compilation ) {
            return [];
        }

        return [{
            pattern: /\[hash]/,
            value: compilation.getStats().hash
        }, {
            pattern: /\[contenthash]/,
            value: this.getContentHash(compilation.assets[this.options.filename].source())
        }];
    }

    getStylesHashes(compilation) {
        if ( !compilation ) {
            return [];
        }

        return [{
            pattern: /\[hash]/,
            value: compilation.getStats().hash
        }, {
            pattern: /\[contenthash]/,
            value: this.getContentHash(compilation.assets[this.options.styles].source())
        }];
    }

    getContentHash(source) {
        return loaderUtils.getHashDigest(source, 'sha1', 'hex', 16);
    }
}
