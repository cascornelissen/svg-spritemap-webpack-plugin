const fs = require('fs');
const path = require('path');
const glob = require('glob');
const svgo = require('svgo');
const mkdirp = require('mkdirp');
const loaderUtils = require('loader-utils');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const { RawSource } = webpack.sources || require('webpack-sources');
const RawModule = require('webpack/lib/RawModule');
const SingleEntryPlugin = webpack.EntryPlugin || webpack.SingleEntryPlugin;

// Helpers
const formatOptions = require('./options-formatter');
const generateSVG = require('./generate-svg');
const generateStyles = require('./generate-styles');
const addWarning = require('./helpers/add-warning');
const { stripVariables, findVariables } = require('./variable-parser');

// Errors & Warnings
const {
    OptionsMismatchWarning,
    VariablesNotSupportedInLanguageWarning,
    VariablesNotSupportedWithFragmentsWarning
} = require('./errors');

const plugin = {
    name: 'SVGSpritemapPlugin'
};

const WEBPACK_VERSION = (global || {}).__WEBPACK_VERSION__ || webpack.version;
const IS_WEBPACK_4 = WEBPACK_VERSION.startsWith('4.');

module.exports = class SVGSpritemapPlugin {
    constructor(pattern, options) {
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
                entries.forEach((entry) => {
                    const plugin = new SingleEntryPlugin(context, entry, name);

                    plugin.apply(compiler);
                });
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
                    } else if ( entry[name].hasOwnProperty('import') ) {
                        applyEntryPlugin([...entry[name].import, helper.path], name);
                    } else if ( Array.isArray(entry[name]) ) {
                        if ( !entry[name].includes(helper.path) ) {
                            applyEntryPlugin([...entry[name], helper.path], name);
                        }
                    } else {
                        // Webpack currently doesn't allow this configuration (object with values other than string/array or descriptors)
                        // but let's make sure we throw if this ever gets added
                        throw new Error(`Unsupported sub-entry type for svg4everybody helper: '${typeof entry[name]}'`);
                    }
                });
            } else {
                throw new Error(`Unsupported entry type for svg4everybody helper: '${typeof entry}'`);
            }
        });

        // Update dependencies when needed
        compiler.hooks.environment.tap(plugin, this.updateDependencies.bind(this));
        compiler.hooks.watchRun.tap(plugin, this.updateDependencies.bind(this));

        // Generate spritemap
        compiler.hooks.make.tapAsync(plugin, (compilation, callback) => {
            const { sprite: spriteOptions, input: inputOptions, output: outputOptions, styles: stylesOptions } = this.options;

            Promise.all(this.files.map((file) => {
                return new Promise((resolve) => {
                    return fs.readFile(file, {
                        encoding: 'utf-8'
                    }, (error, content) => {
                        resolve({
                            path: file,
                            content: content
                        });
                    });
                });
            })).then((sources) => {
                if ( spriteOptions.generate.view && !spriteOptions.generate.use ) {
                    addWarning(new OptionsMismatchWarning(`Using sprite.generate.view requires sprite.generate.use to be enabled`), compilation);
                }

                if ( spriteOptions.generate.use && !spriteOptions.generate.symbol ) {
                    addWarning(new OptionsMismatchWarning(`Using sprite.generate.use requires sprite.generate.symbol to be enabled`), compilation);
                }

                if ( spriteOptions.generate.title && !spriteOptions.generate.symbol ) {
                    addWarning(new OptionsMismatchWarning(`Using sprite.generate.title requires sprite.generate.symbol to be enabled`), compilation);
                }

                if ( spriteOptions.generate.symbol === true && spriteOptions.generate.view === true ) {
                    addWarning(new OptionsMismatchWarning(`Both sprite.generate.symbol and sprite.generate.view are set to true which will cause identifier conflicts, use a string value (postfix) for either of these options`), compilation);
                }

                this.filenames = {
                    spritemap: this.options.output.filename,
                    styles: this.options.styles.filename
                };

                // Generate SVG
                generateSVG(sources, {
                    sprite: spriteOptions,
                    output: outputOptions,
                    input: inputOptions
                }, compilation).then((spritemap) => {
                    if (spritemap) {
                        compilation.emitAsset(outputOptions.filename, new RawSource(spritemap), {
                            immutable: this.spritemapCache === spritemap,
                            development: false,
                            javascriptModule: false
                        });

                        // Store spritemap in cache to make sure we can check for immutability in the next compilation
                        this.spritemapCache = spritemap;
                    }

                    // Generate styles
                    compilation.hooks.afterHash.tap(plugin, () => {
                        this.updateFilename('spritemap', compilation);

                        if ( !stylesOptions ) {
                            return;
                        }

                        const extension = path.extname(stylesOptions.filename).substring(1).toLowerCase();
                        this.styles = generateStyles(spritemap, {
                            extension: extension,
                            keepAttributes: stylesOptions.keepAttributes,
                            prefix: spriteOptions.prefix,
                            postfix: {
                                symbol: spriteOptions.generate.symbol,
                                view: spriteOptions.generate.view
                            },
                            format: {
                                type: stylesOptions.format,
                                publicPath: (() => {
                                    const publicPath = compilation.outputOptions.publicPath;

                                    if ( typeof publicPath === 'undefined' || publicPath === 'auto' ) {
                                        return `/${this.filenames.spritemap}`;
                                    }

                                    return `${publicPath.replace(/\/$/, '')}/${this.filenames.spritemap}`;
                                })()
                            },
                            variables: stylesOptions.variables,
                            callback: stylesOptions.callback
                        });

                        // Emit a warning when variables are detected while the language doesn't support it
                        if ( !['scss', 'sass'].includes(extension) && findVariables(spritemap).length ) {
                            addWarning(new VariablesNotSupportedInLanguageWarning(extension), compilation);
                        }

                        // Emit a warning when variables are detected while the stylesOptions.format is set to 'fragment'
                        if ( stylesOptions.format === 'fragment' && findVariables(spritemap).length ) {
                            addWarning(new VariablesNotSupportedWithFragmentsWarning(), compilation);
                        }

                        if ( stylesOptions.format === 'fragment' && !spriteOptions.generate.view ) {
                            addWarning(new OptionsMismatchWarning(`Using styles.format with value 'fragment' in combination with sprite.generate.view with value false will result in CSS fragments not working correctly`), compilation);
                        }

                        // Include warnings received from the style formatters
                        if ( this.styles.warnings && this.styles.warnings.length ) {
                            compilation.warnings = [...compilation.warnings, ...this.styles.warnings];
                        }

                        // Write the styles file before compilation starts to make sure the files
                        // are written to disk before other plugins/loaders (e.g. mini-css-extract-plugin) can use them
                        this.stylesType = this.getStylesType(this.styles.content, stylesOptions.filename);
                        this.writeStylesToDisk(this.styles.content, this.stylesType);

                        if ( typeof this.styles !== 'undefined' && this.stylesType === 'asset' ) {
                            compilation.emitAsset(stylesOptions.filename, new RawSource(this.styles.content))
                        }
                    });

                    compilation.hooks.beforeChunks.tap(plugin, () => {
                        // Set up a dummy module that we can add to our source chunk
                        // To prevent it from getting cleaned up, this seems to be required
                        // to correctly link the spritemap asset to the chunk
                        const chunk = compilation.addChunk(outputOptions.chunk.name);
                        chunk.reason = 'svg-spritemap-webpack-plugin dummy module';

                        const module = new RawModule('', `${outputOptions.chunk.name}-dummy-module`);
                        module.buildInfo = {};
                        module.buildMeta = {};

                        if ( IS_WEBPACK_4 ) {
                            module.hash = '';
                            chunk.addModule(module);
                        } else {
                            compilation.modules.add(module);
                            compilation.chunkGraph.connectChunkAndModule(chunk, module);
                        }
                    })

                    // Optimize spritemap SVG/filename
                    compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                        const { output: outputOptions, sprite: spriteOptions } = this.options;
                        const asset = compilation.getAsset(this.filenames.spritemap);

                        if (!asset) {
                            return callback();
                        }

                        // Strip variables from spritemap SVG
                        const stripped = stripVariables(asset.source);
                        compilation.updateAsset(this.filenames.spritemap, new RawSource(stripped));

                        if ( outputOptions.svgo === false ) {
                            return callback();
                        }

                        const SVGOptimizer = new svgo(merge({
                            plugins: [{
                                removeTitle: !spriteOptions.generate.title // Disable the removeTitle plugin when title elements should be generated
                            }]
                        }, outputOptions.svgo, {
                            plugins: [{
                                cleanupIDs: false // Force disable cleanupIDs as the identifiers are to be used to target a specific sprite
                            }]
                        }));

                        SVGOptimizer.optimize(assets[this.filenames.spritemap].source()).then((output) => {
                            // Update the optimized asset based on the hashed filename
                            compilation.updateAsset(this.filenames.spritemap, new RawSource(output.data), {
                                minimized: true
                            });

                            return callback();
                        });
                    });

                    // Optimize styles filename
                    compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                        if ( typeof this.styles === 'undefined' || this.stylesType !== 'asset' ) {
                            return callback();
                        }

                        this.updateFilename(this.filenames.styles, compilation);

                        return callback();
                    });

                    // Make sure we add the generated SVG as a file to the spritemap chunk
                    if ( IS_WEBPACK_4 ) {
                        compilation.hooks.afterOptimizeChunkAssets.tap(plugin, () => {
                            compilation.chunks.forEach((chunk) => {
                                if ( chunk.name !== outputOptions.chunk.name ) {
                                    return;
                                }

                                chunk.files.push(this.filenames.spritemap);
                            });
                        });
                    } else {
                        compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
                            compilation.hooks.processAssets.tap({
                                name: this.constructor.name,
                                stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
                            }, () => {
                                compilation.chunks.forEach((chunk) => {
                                    if ( chunk.name !== outputOptions.chunk.name ) {
                                        return;
                                    }

                                    chunk.files.add(this.filenames.spritemap);
                                });
                            });
                        });
                    }

                    callback();
                });
            });
        });

        // Clean up the spritemap chunk
        if (IS_WEBPACK_4) {
            compiler.hooks.emit.tap(plugin, (compilation) => {
                this.cleanUpChunk(compilation);
            });
        } else {
            compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
                compilation.hooks.processAssets.tap({
                    name: this.constructor.name,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
                }, () => {
                    this.cleanUpChunk(compilation);
                });
            });
        }

        // Add context dependencies to webpack compilation to make sure watching works correctly
        compiler.hooks.afterCompile.tap(plugin, (compilation) => {
            this.directories.forEach((directory) => {
                compilation.contextDependencies.add(directory);
            });
        });
    }

    cleanUpChunk(compilation) {
        const { output: outputOptions } = this.options;
        if ( outputOptions.chunk.keep ) {
            return;
        }

        // Fetch existing filenames from all instances of this plugin
        const filenames = compilation.options.plugins.filter((plugin) => {
            return plugin instanceof SVGSpritemapPlugin;
        }).map((plugin) => {
            return Object.values(plugin.filenames);
        }).reduce((filenames, values) => {
            return filenames.concat(values);
        }, []);

        Array.from(compilation.chunks).filter((chunk) => {
            if ( !chunk.name ) {
                return false;
            }

            if ( chunk.name === outputOptions.chunk.name ) {
                return true;
            }

            if ( chunk.name.startsWith(`${outputOptions.chunk.name}${compilation.options.optimization.splitChunks.automaticNameDelimiter}`) ) {
                return true;
            }
        }).forEach((chunk) => {
            Array.from(chunk.files).filter((file) => {
                return !filenames.includes(file);
            }).forEach((file) => {
                if (IS_WEBPACK_4) {
                    delete compilation.assets[file];
                } else {
                    compilation.deleteAsset(file);
                }
            });
        });
    }

    updateDependencies() {
        const { input: inputOptions } = this.options;

        this.files = [];
        this.directories = [];

        inputOptions.patterns.forEach((pattern) => {
            this.directories.push(path.resolve(pattern.replace(/\*.*/, '')));

            glob.sync(pattern, inputOptions.options).map((match) => {
                const pathname = path.resolve(match);
                const stats = fs.lstatSync(pathname);

                if (stats.isFile()) {
                    this.files = [...new Set([...this.files, pathname])];

                    // Add parent directories of files to directory watch list
                    // to ensure new files in these directories are watched as well
                    this.directories = [...new Set([...this.directories, pathname.substring(0, pathname.lastIndexOf(path.sep))])];
                } else if (stats.isDirectory()) {
                    this.directories = [...new Set([...this.directories, pathname])];
                }
            });
        });
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

    updateFilename(identifier, compilation) {
        const oldFilename = this.filenames[identifier];
        const asset = compilation.getAsset(oldFilename);

        if (!asset) {
            return oldFilename;
        }

        const source = typeof asset.source === 'string' ? asset.source : asset.source._value;
        const hash = compilation.hash;
        const contenthash = asset && loaderUtils.getHashDigest(source, 'sha1', 'hex', 32);

        const newFilename = [{
            pattern: /\[hash]/,
            value: hash || '[hash]'
        }, {
            pattern: /\[contenthash]/,
            value: contenthash || '[contenthash]'
        }].reduce((filename, item) => {
            const pattern = new RegExp(item.pattern, 'ig');

            return filename.replace(pattern, item.value);
        }, this.filenames[identifier]);

        if (IS_WEBPACK_4) {
            delete compilation.assets[oldFilename];
            compilation.assets[newFilename] = asset;
        } else {
            compilation.renameAsset(oldFilename, newFilename);
        }

        compilation.updateAsset(newFilename, source, {
            contenthash: contenthash
        });
        this.filenames[identifier] = newFilename;
    }
};
