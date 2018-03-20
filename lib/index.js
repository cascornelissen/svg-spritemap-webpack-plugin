const fs = require('fs');
const get = require('get-value');
const path = require('path');
const glob = require('glob');
const svgo = require('svgo');
const idify = require('html4-id');
const merge = require('webpack-merge');
const xmldom = require('xmldom');
const loaderUtils = require('loader-utils');
const isPlainObject = require('is-plain-object');
const { RawSource } = require('webpack-sources');
const svgToMiniDataURI = require('mini-svg-data-uri');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');

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
            svgo: true,
            glob: true,
            styles: false,
            svg4everybody: false
        }, options);

        // Sanitize options
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

        if ( this.options.glob === true ) {
            this.options.glob = {};
        }

        if ( this.options.styles === false ) {
            this.options.styles = '';
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
                file: fs.readFileSync(path.join(__dirname, '/helpers/svg4everybody.template.js'), 'utf8'),
                path: path.join(__dirname, '/../svg4everybody-helper.js')
            }

            // Write the helper file to disk
            fs.writeFileSync(helper.path, helper.file.replace('{/* PLACEHOLDER */}', JSON.stringify(this.options.svg4everybody)), 'utf8');

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
            const spritemap = this.generateSVG(this.files);
            if ( !spritemap ) {
                return;
            }

            // Generate styles
            const extension = path.extname(this.options.styles).substring(1).toLowerCase();
            const styles = this.generateStyles(spritemap, extension);

            // Add (unoptimized) spritemap as asset
            compilation.hooks.additionalAssets.tap(plugin, () => {
                compilation.assets[this.options.filename] = new RawSource(spritemap);
            });

            // Add styles asset when options.styles is a filename-only string
            compilation.hooks.additionalAssets.tap(plugin, () => {
                if ( !styles || path.parse(this.options.styles).dir ) {
                    // TODO: Write styles file to disk
                    console.log('WRITING TO DISK');
                    return;
                }

                compilation.assets[this.options.styles] = new RawSource(styles);
            });

            // Optimize spritemap SVG/filename when needed
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                // Rewrite the compilation.assets hashes for the spritemap asset
                const hashedAssets = this.rewriteAssetHash(this.options.filename, compilation.assets, [{
                    pattern: /\[hash]/,
                    value: compilation.getStats().hash
                }, {
                    pattern: /\[contenthash]/,
                    value: loaderUtils.getHashDigest(compilation.assets[this.options.filename].source(), 'sha1', 'hex', 16)
                }]);

                // Update the compilation assets with the hashed ones
                compilation.assets = hashedAssets.assets;

                if ( this.options.svgo === false ) {
                    return callback();
                }

                const SVGOptimizer = new svgo(this.options.svgo);
                SVGOptimizer.optimize(assets[this.options.filename].source()).then((output) => {
                    // Update the optimized asset based on the hashed filename
                    compilation.assets[hashedAssets.filename] = new RawSource(output.data);

                    return callback();
                });
            });

            // Optimize styles filename
            compilation.hooks.optimizeAssets.tapAsync(plugin, (assets, callback) => {
                if ( !styles || path.parse(this.options.styles).dir ) {
                    return callback();
                }

                // Rewrite the compilation.assets hashes for the styles asset
                const hashedAssets = this.rewriteAssetHash(this.options.styles, compilation.assets, [{
                    pattern: /\[hash]/,
                    value: compilation.getStats().hash
                }, {
                    pattern: /\[contenthash]/,
                    value: loaderUtils.getHashDigest(compilation.assets[this.options.styles].source(), 'sha1', 'hex', 16)
                }]);

                // Update the compilation assets with the hashed ones
                compilation.assets = hashedAssets.assets;

                return callback();
            });
        });

        // Add context dependencies to webpack compilation to make sure watching works correctly
        compiler.hooks.afterCompile.tap(plugin, (compilation) => {
            this.directories.forEach((directory) => {
                compilation.contextDependencies.add(directory);
            });
        });
    }

    updateDependencies() {
        this.files = glob.sync(this.options.src, this.options.glob);
        this.directories = glob.sync(`${this.options.src.substring(0, this.options.src.lastIndexOf('/'))}/`);
    }

    // TODO: Write tests for this method
    rewriteAssetHash(filename, assets = [], hashes = []) {
        // Update patterns in original filename with hash values accordingly
        const hashedFilename = hashes.reduce((output, hash) => {
            const pattern = new RegExp(hash.pattern, 'ig');
            return output.replace(pattern, hash.value);
        }, filename);

        // Update the assets when the filename contained hashes
        if ( hashedFilename !== filename ) {
            assets[hashedFilename] = assets[filename];
            delete assets[filename];
        }

        // Return the resulting (hashed) filename together with the assets
        return {
            filename, hashedFilename,
            assets: assets
        };
    }

    generateSVG(files) {
        // No point in generating when there are no files
        if ( !files.length ) {
            return;
        }

        // Initialize DOM/XML
        const DOMParser = new xmldom.DOMParser();
        const XMLSerializer = new xmldom.XMLSerializer();
        const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

        // Create SVG element
        const svg = XMLDoc.createElement('svg');
        let sizes = {
            width: [],
            height: []
        };

        // Add namespaces
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Add symbol for each file
        files.forEach((file) => {
            const id = `${this.options.prefix}${path.basename(file, path.extname(file))}`;
            const validId = idify(id);

            // Parse source SVG
            const contents = fs.readFileSync(file, 'utf8');
            const sprite = DOMParser.parseFromString(contents).documentElement;

            // Get sizes
            let viewbox = (sprite.getAttribute('viewBox') || sprite.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
            let width = parseFloat(sprite.getAttribute('width'));
            let height = parseFloat(sprite.getAttribute('height'));

            if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
                throw new Error(`Invalid SVG '${file}'; it's lacking both a viewBox and width/height attributes...`);
            }

            if ( viewbox.length !== 4 ) {
                viewbox = [0, 0, width, height];
            }

            if ( isNaN(width) ) {
                width = viewbox[2];
            }

            if ( isNaN(height) ) {
                height = viewbox[3];
            }

            // Create symbol
            const symbol = XMLDoc.createElement('symbol');
            symbol.setAttribute('id', validId);
            symbol.setAttribute('viewBox', viewbox.join(' '));

            // Make sure we don't overwrite the existing title
            const hasTitle = (sprite) => {
                const titles = Array.from(sprite.childNodes).filter((childNode) => {
                    return childNode.nodeName.toLowerCase() === 'title';
                });

                return !!titles.length;
            };

            // Add title to improve accessibility
            if ( !hasTitle(sprite) ) {
                const title = XMLDoc.createElement('title');
                title.appendChild(XMLDoc.createTextNode(id.replace(this.options.prefix, '')));
                symbol.appendChild(title);
            }

            // Clone the original contents of the SVG file into the new symbol
            Array.from(sprite.childNodes).forEach((childNode) => {
                symbol.appendChild(childNode);
            });

            svg.appendChild(symbol);

            // Generate <use> elements within spritemap to allow usage within CSS
            const use = XMLDoc.createElement('use');
            use.setAttribute('xlink:href', `#${validId}`);
            use.setAttribute('x', '0');
            use.setAttribute('y', sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * this.options.gutter));
            use.setAttribute('width', width.toString());
            use.setAttribute('height', height.toString());
            svg.appendChild(use);

            // Update sizes
            sizes.width.push(width);
            sizes.height.push(height);
        });

        // Add width/height to spritemap
        svg.setAttribute('width', Math.max.apply(null, sizes.width).toString());
        svg.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * this.options.gutter)).toString());

        return XMLSerializer.serializeToString(svg);
    }

    generateStyles(spritemap, extension) {
        if ( !spritemap || !extension ) {
            return;
        }

        const DOMParser = new xmldom.DOMParser();

        // Parse SVG and extract <symbol> elements
        const svg = DOMParser.parseFromString(spritemap).documentElement;
        const symbols = Array.from(svg.childNodes).filter((childNode) => childNode.nodeName === 'symbol');

        const formatters = {
            'css': this.formatCSS,
            'scss': this.formatSCSS,
            'sass': this.formatSCSS,
            'less': this.formatLESS
        };

        const formatter = formatters[extension];
        if ( typeof formatter === 'undefined' ) {
            throw new Error(`Unsupported styles extension: ${extension}`);
        }

        return formatter(symbols);
    }

    formatCSS(symbols = []) {
        const XMLSerializer = new xmldom.XMLSerializer();
        const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

        const styles = symbols.map((symbol) => {
            const svg = XMLDoc.createElement('svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));

            // Clone symbol contents to svg
            Array.from(symbol.childNodes).forEach((childNode) => {
                if ( ['title'].includes(childNode.nodeName.toLowerCase()) ) {
                    return;
                }

                svg.appendChild(childNode);
            });

            const selector = symbol.getAttribute('id');
            const dataURI = svgToMiniDataURI(XMLSerializer.serializeToString(svg));

            return `.${selector} { background-image: url("${dataURI}"); }`;
        });

        return styles.join('\n');
    }

    formatSCSS(symbols = []) {
        // TODO
    }

    formatLESS(symbols = []) {
        // TODO
    }
}

