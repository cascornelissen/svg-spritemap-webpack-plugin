var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    svgo = require('svgo'),
    idify = require('html4-id'),
    merge = require('webpack-merge'),
    xmldom = require('xmldom'),
    loaderUtils = require('loader-utils'),
    isPlainObject = require('is-plain-object'),
    RawSource = require('webpack-sources').RawSource;

function SVGSpritemapPlugin(options) {
    // Merge specified options with default options
    this.options = merge({
        src: '**/*.svg',
        svgo: {},
        glob: {},
        prefix: 'sprite-',
        gutter: 2,
        filename: 'spritemap.svg',
        chunk: 'spritemap',
        deleteChunk: true,
        svg4everybody: false,
        generateTitle: true
    }, options, {
        svgo: {
            plugins: [{
                cleanupIDs: false
            }]
        }
    });
}

SVGSpritemapPlugin.prototype.apply = function(compiler) {
    var options = this.options,
        files = glob.sync(options.src, options.glob);

    compiler.plugin('this-compilation', function(compilation) {
        compilation.plugin('optimize-chunks', function optmizeChunks(chunks) {
            if ( files.length ) {
                // Add new chunk for spritemap
                compilation.addChunk(options.chunk);
            }
        });

        compilation.plugin('additional-chunk-assets', function additionalChunkAssets(chunks) {
            var svg = generateSVG();
            if ( !svg ) {
                return;
            }

            var source = new RawSource(svg);
            var sourceChunk = compilation.namedChunks[options.chunk];
            var filename = options.filename
                .replace(/\[hash]/ig, compilation.getStats().hash)
                .replace(/\[contenthash]/ig, function() {
                    return loaderUtils.getHashDigest(source.source(), 'sha1', 'hex', 16);
                });

            // Add actual (unoptimized) SVG to spritemap chunk
            compilation.additionalChunkAssets.push(filename);
            compilation.assets[filename] = source;
            sourceChunk.files.push(filename);
        });

        compilation.plugin('optimize-chunk-assets', function optimizeChunkAssets(chunks, callback) {
            // Optimize spritemap using SVGO
            if ( options.svgo === false ) {
                callback();
                return;
            }

            chunks = chunks.filter(function(chunk) {
                return chunk.name === options.chunk;
            });

            if ( !chunks.length ) {
                callback();
                return;
            }

            chunks.forEach(function(chunk) {
                var SVGOptimizer = new svgo(options.svgo);
                var filename = chunk.files[1];

                SVGOptimizer.optimize(compilation.assets[filename].source(), function(o) {
                    compilation.assets[filename] = new RawSource(o.data);
                    callback();
                });
            });
        });

        var generateSVG = function() {
            // No point in generating when there are no files
            if ( !files.length ) {
                return false;
            }

            // Initialize DOM/XML classes and SVGO
            var DOMParser = new xmldom.DOMParser(),
                XMLSerializer = new xmldom.XMLSerializer(),
                XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null); // `document` alternative for NodeJS environments

            // Create SVG element
            var spritemap = XMLDoc.createElement('svg'),
                sizes = { width: [], height: [] };

            // Add namespaces
            spritemap.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            spritemap.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

            // Add symbol for each file
            files.forEach(function(file) {
                var id = options.prefix + path.basename(file, path.extname(file)),
                    validId = idify(id);

                // Parse source SVG
                var contents = fs.readFileSync(file, 'utf8'),
                    svg = DOMParser.parseFromString(contents).documentElement,
                    viewbox = (svg.getAttribute('viewBox') || svg.getAttribute('viewbox')).split(' ').map(function(a) { return parseFloat(a); }),
                    width = parseFloat(svg.getAttribute('width')),
                    height = parseFloat(svg.getAttribute('height'));

                if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
                    console.error('Skipping sprite \'%s\' since it\'s lacking both a viewBox and width/height attributes...', id.replace(options.prefix, ''));
                    return;
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
                var symbol = XMLDoc.createElement('symbol');
                symbol.setAttribute('id', validId);
                symbol.setAttribute('viewBox', viewbox.join(' '));

                // Generate a title or not ?
                if( options.generateTitle ) {
                    // Make sure we don't overwrite the existing title
                    var hasTitle = false;
                    for ( var i = 0; i < svg.childNodes.length; i++ ) {
                        if ( svg.childNodes[i].tagName && svg.childNodes[i].tagName.toLowerCase() === 'title' ) {
                            var hasTitle = true;
                        }
                    }

                    // Add title for improved accessibility
                    if ( !hasTitle ) {
                        var title = XMLDoc.createElement('title');
                        title.appendChild(XMLDoc.createTextNode(id.replace(options.prefix, '')));
                        symbol.appendChild(title);
                    }
                }

                // Clone the original contents of the SVG file into the new symbol
                while ( svg.childNodes.length > 0 ) {
                    symbol.appendChild(svg.childNodes[0]);
                }

                spritemap.insertBefore(symbol, spritemap.firstChild);

                // Generate <use> elements within spritemap to allow usage within CSS
                var sprite = XMLDoc.createElement('use');
                sprite.setAttribute('xlink:href', '#' + validId);
                sprite.setAttribute('x', 0);
                sprite.setAttribute('y', sizes.height.reduce(function(a, b) { return a + b; }, 0) + sizes.height.length * options.gutter);
                sprite.setAttribute('width', width);
                sprite.setAttribute('height', height);
                spritemap.appendChild(sprite);

                // Update sizes
                sizes.width.push(width);
                sizes.height.push(height);
            });

            // Adds width/height to spritemap
            spritemap.setAttribute('width', Math.max.apply(null, sizes.width));
            spritemap.setAttribute('height', sizes.height.reduce(function(a, b) { return a + b; }, 0) + (sizes.height.length - 1) * options.gutter);

            // No point in optimizing/saving when there are no SVGs
            if ( !spritemap.childNodes.length ) {
                return false;
            }

            return XMLSerializer.serializeToString(spritemap);
        }
    });

    compiler.plugin('emit', function(compilation, callback) {
        compilation.chunks.forEach(function(chunk) {
            if ( chunk.name !== options.chunk ) {
                return;
            }

            // Remove entry (.js file) from compilation assets since it's empty anyway
            if (options.deleteChunk) {
                delete compilation.assets[chunk.files[0]];
            }
        });

        callback();
    });

    compiler.plugin('entry-option', function(context, entry) {
        if ( options.svg4everybody ) {
            // This is a little hacky but there's no other way since Webpack
            // doesn't support virtual files (https://github.com/rmarscher/virtual-module-webpack-plugin)
            var helper = fs.readFileSync(path.join(__dirname, '/helpers/svg4everybody.template.js'), 'utf8');
            fs.writeFileSync(path.join(__dirname, '/svg4everybody-helper.js'), helper.replace('{/* PLACEHOLDER */}', JSON.stringify(options.svg4everybody)), 'utf8');

            var newEntry = path.join(__dirname, '/svg4everybody-helper.js');
            if ( typeof entry === 'string' ) {
                entry = [entry, newEntry];
            } else if ( Array.isArray(entry) ) {
                if ( !entry.includes(newEntry) ) {
                    entry.push(newEntry);
                }
            } else if ( isPlainObject(entry) ) {
                Object.keys(entry).forEach(function(item) {
                    if ( !entry[item].includes(newEntry) ) {
                        entry[item].push(newEntry);
                    }
                });
            } else {
                console.log('Unsupported entry type:', entry);
            }
        }
    });
};

module.exports = SVGSpritemapPlugin;
