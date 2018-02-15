const fs = require('fs');
const path = require('path');
const glob = require('glob');
const svgo = require('svgo');
const idify = require('html4-id');
const merge = require('webpack-merge');
const xmldom = require('xmldom');
const loaderUtils = require('loader-utils');
const isPlainObject = require('is-plain-object');
const { RawSource } = require('webpack-sources');

const plugin = {
    name: 'SVGSpritemapPlugin'
};

module.exports = class ExtractTextPlugi {
    constructor(options) {
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
    }

    apply(compiler) {
        const options = this.options;
        const files = glob.sync(options.src, options.glob);

        compiler.hooks.thisCompilation.tap(plugin, (compilation) => {
            compilation.hooks.optimizeChunks.tap(plugin, () => {
                if ( !files.length ) {
                    return;
                }

                // Add new chunk for spritemap
                compilation.addChunk(options.chunk);
            });

            compilation.hooks.additionalChunkAssets.tap(plugin, () => {
                const svg = this.generateSVG(files);
                if ( !svg ) {
                    return;
                }

                const source = new RawSource(svg);
                const sourceChunk = compilation.namedChunks.get(options.chunk);
                const filename = options.filename
                    .replace(/\[hash]/ig, compilation.getStats().hash)
                    .replace(/\[contenthash]/ig, () => loaderUtils.getHashDigest(source.source(), 'sha1', 'hex', 16));

                // Add actual (unoptimized) SVG to spritemap chunk
                compilation.additionalChunkAssets.push(filename);
                compilation.assets[filename] = source;
                sourceChunk.files.push(filename);
            });

            compilation.hooks.optimizeChunkAssets.tapAsync(plugin, (chunks, callback) => {
                // Optimize spritemap using SVGO
                if ( options.svgo === false ) {
                    return callback();
                }

                chunks = chunks.filter((chunk) => chunk.name === options.chunk);
                if ( !chunks.length ) {
                    return callback();
                }

                chunks.forEach((chunk) => {
                    const SVGOptimizer = new svgo(options.svgo);
                    const filename = chunk.files[1];

                    SVGOptimizer.optimize(compilation.assets[filename].source(), (output) => {
                        compilation.assets[filename] = new RawSource(output.data);
                        callback();
                    });
                });
            });
        });

        compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
            compilation.chunks.forEach((chunk) => {
                if ( chunk.name !== options.chunk ) {
                    return;
                }

                if ( options.deleteChunk ) {
                    // Remove entry (.js file) from compilation assets since it's empty anyway
                    delete compilation.assets[chunk.files[0]];
                }
            });

            callback();
        });

        compiler.hooks.entryOption.tap(plugin, (context, entry) => {
            if ( !options.svg4everybody ) {
                return;
            }

            // This is a little hacky but there's no other way since Webpack
            // doesn't support virtual files (https://github.com/rmarscher/virtual-module-webpack-plugin)
            const helper = fs.readFileSync(path.join(__dirname, '/helpers/svg4everybody.template.js'), 'utf8');
            fs.writeFileSync(path.join(__dirname, '/svg4everybody-helper.js'), helper.replace('{/* PLACEHOLDER */}', JSON.stringify(options.svg4everybody)), 'utf8');

            const newEntry = path.join(__dirname, '/svg4everybody-helper.js');
            if ( typeof entry === 'string' ) {
                entry = [entry, newEntry];
            } else if ( Array.isArray(entry) ) {
                if ( entry.includes(newEntry) ) {
                    return;
                }

                entry.push(newEntry);
            } else if ( isPlainObject(entry) ) {
                Object.keys(entry).forEach((item) => {
                    if ( entry[item].includes(newEntry) ) {
                        return;
                    }

                    entry[item].push(newEntry);
                });
            } else {
                console.log('Unsupported entry type:', entry);
            }
        });
    }

    generateSVG(files) {
        const options = this.options;

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
            const id = `${options.prefix}${path.basename(file, path.extname(file))}`;
            const validId = idify(id);

            // Parse source SVG
            const contents = fs.readFileSync(file, 'utf8');
            const svg = DOMParser.parseFromString(contents).documentElement;

            // Get sizes
            let viewbox = (svg.getAttribute('viewBox') || svg.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
            let width = parseFloat(svg.getAttribute('width'));
            let height = parseFloat(svg.getAttribute('height'));

            if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
                return console.error('Skipping sprite \'%s\' since it\'s lacking both a viewBox and width/height attributes...', id.replace(options.prefix, ''));
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
                title.appendChild(XMLDoc.createTextNode(id.replace(options.prefix, '')));
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
            sprite.setAttribute('y', sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * options.gutter));
            sprite.setAttribute('width', width.toString());
            sprite.setAttribute('height', height.toString());
            spritemap.appendChild(sprite);

            // Update sizes
            sizes.width.push(width);
            sizes.height.push(height);
        });

        // Adds width/height to spritemap
        spritemap.setAttribute('width', Math.max.apply(null, sizes.width).toString());
        spritemap.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * options.gutter)).toString());

        // No point in optimizing/saving when there are no SVGs
        if ( !spritemap.childNodes.length ) {
            return false;
        }

        return XMLSerializer.serializeToString(spritemap);
    }
}
