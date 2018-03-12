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
            svgo: {},
            glob: {},
            prefix: 'sprite-',
            gutter: 2,
            filename: 'spritemap.svg',
            chunk: 'spritemap',
            deleteChunk: true,
            svg4everybody: false
        }, options, {
            svgo: {
                plugins: [{
                    cleanupIDs: false
                }]
            }
        });

        // Dependencies
        this.files = [];
        this.directories = [];
    }

    apply(compiler) {
        // Update dependencies when needed
        compiler.hooks.environment.tap(plugin, this.updateDependencies.bind(this));
        compiler.hooks.watchRun.tap(plugin, this.updateDependencies.bind(this));

        // Add context dependencies to webpack compilation to make sure watching works correctly
        compiler.hooks.afterCompile.tap(plugin, (compilation) => {
            this.directories.forEach((directory) => {
                compilation.contextDependencies.add(directory);
            });
        });

        // Generate the SVG and calculate the contenthash
        compiler.hooks.make.tap(plugin, (compilation) => {
            const svg = this.generateSVG(this.files);
            const source = new RawSource(svg);
            const hash = compilation.getStats().hash;
            const contenthash = loaderUtils.getHashDigest(source.source(), 'sha1', 'hex', 16);

            compilation.hooks.optimizeChunks.tap(plugin, () => {
                if ( !this.files.length ) {
                    return;
                }

                // Add new chunk for spritemap
                compilation.addChunk(this.options.chunk);
            });

            // Overwrite the spritemap chunk hash to the custom SVG contenthash to make sure
            // webpack notices the changes and prints the stats output again
            compilation.hooks.chunkHash.tap(plugin, (chunk, chunkHash) => {
                if ( chunk.id !== this.options.chunk || !svg ) {
                    return;
                }

                chunkHash.digest = () => contenthash;
            });

            compilation.hooks.additionalChunkAssets.tap(plugin, () => {
                if ( !svg ) {
                    return;
                }

                const sourceChunk = compilation.namedChunks.get(this.options.chunk);
                const filename = this.options.filename
                    .replace(/\[hash]/ig, hash)
                    .replace(/\[contenthash]/ig, () => contenthash);

                // Add actual (unoptimized) SVG to spritemap chunk
                compilation.additionalChunkAssets.push(filename);
                compilation.assets[filename] = source;
                sourceChunk.files.push(filename);
            });

            compilation.hooks.optimizeChunkAssets.tapAsync(plugin, (chunks, callback) => {
                // Optimize spritemap using SVGO
                if ( this.options.svgo === false ) {
                    return callback();
                }

                chunks = chunks.filter((chunk) => chunk.name === this.options.chunk);
                if ( !chunks.length ) {
                    return callback();
                }

                chunks.forEach((chunk) => {
                    const SVGOptimizer = new svgo(this.options.svgo);
                    const filename = chunk.files[1];

                    SVGOptimizer.optimize(compilation.assets[filename].source()).then((output) => {
                        compilation.assets[filename] = new RawSource(output.data);
                        callback();
                    });
                });
            });
        });

        compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
            compilation.chunks.forEach((chunk) => {
                if ( chunk.name !== this.options.chunk || !this.options.deleteChunk ) {
                    return;
                }

                // Remove entry (.js file) from compilation assets since it's empty anyway
                delete compilation.assets[chunk.files[0]];
            });

            callback();
        });

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
    }

    updateDependencies() {
        this.files = glob.sync(this.options.src, this.options.glob);
        this.directories = glob.sync(`${this.options.src.substring(0, this.options.src.lastIndexOf('/'))}/`);
    }

    generateSVG(files) {
        // No point in generating when there are no files
        if ( !files.length ) {
            return;
        }

        // Initialize DOM/XML
        const DOMParser = new xmldom.DOMParser();
        const XMLSerializer = new xmldom.XMLSerializer();
        const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null); // `document` alternative for NodeJS environments

        // Create SVG element
        const spritemap = XMLDoc.createElement('svg');
        let sizes = {
            width: [],
            height: []
        };

        // Add namespaces
        spritemap.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        spritemap.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

        // Add symbol for each file
        files.forEach((file) => {
            const id = `${this.options.prefix}${path.basename(file, path.extname(file))}`;
            const validId = idify(id);

            // Parse source SVG
            const contents = fs.readFileSync(file, 'utf8');
            const svg = DOMParser.parseFromString(contents).documentElement;

            // Get sizes
            let viewbox = (svg.getAttribute('viewBox') || svg.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
            let width = parseFloat(svg.getAttribute('width'));
            let height = parseFloat(svg.getAttribute('height'));

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
            const hasTitle = () => {
                for ( let i = 0; i < svg.childNodes.length; i++ ) {
                    if ( svg.childNodes[i].tagName && svg.childNodes[i].tagName.toLowerCase() === 'title' ) {
                        return true;
                    }
                }

                return false;
            };

            // Add title for improved accessibility
            if ( !hasTitle() ) {
                const title = XMLDoc.createElement('title');
                title.appendChild(XMLDoc.createTextNode(id.replace(this.options.prefix, '')));
                symbol.appendChild(title);
            }

            // Clone the original contents of the SVG file into the new symbol
            while ( svg.childNodes.length > 0 ) {
                symbol.appendChild(svg.childNodes[0]);
            }

            spritemap.insertBefore(symbol, spritemap.firstChild);

            // Generate <use> elements within spritemap to allow usage within CSS
            const sprite = XMLDoc.createElement('use');
            sprite.setAttribute('xlink:href', `#${validId}`);
            sprite.setAttribute('x', '0');
            sprite.setAttribute('y', sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * this.options.gutter));
            sprite.setAttribute('width', width.toString());
            sprite.setAttribute('height', height.toString());
            spritemap.appendChild(sprite);

            // Update sizes
            sizes.width.push(width);
            sizes.height.push(height);
        });

        // Adds width/height to spritemap
        spritemap.setAttribute('width', Math.max.apply(null, sizes.width).toString());
        spritemap.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * this.options.gutter)).toString());

        return XMLSerializer.serializeToString(spritemap);
    }
}
