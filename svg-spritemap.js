var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    svgo = require('svgo'),
    idify = require('html4-id'),
    xmldom = require('xmldom');

function SVGSpritemapPlugin(options) {
    // Merge specified options with default options
    this.options = _.merge({}, {
        src: '**/*.svg',
        svgo: {},
        glob: {},
        prefix: '',
        filename: 'spritemap.svg'
    }, options);

    // Make sure we always disable the `cleanupIDs` SVGO plugin since this would remove all symbols
    // https://github.com/svg/svgo/issues/416
    if ( !Array.isArray(this.options.svgo.plugins) ) this.options.svgo.plugins = [];
    this.options.svgo.plugins.push({ cleanupIDs: false });
}

SVGSpritemapPlugin.prototype.apply = function(compiler) {
    var options = this.options;

    compiler.plugin('emit', function(compilation, callback) {
        glob(options.src, options.glob, function(err, files) {
            if ( err ) throw err;

            // No point in generating when there are no files
            if ( !files.length ) {
                callback();
                return false;
            }

            // Initialize DOM/XML classes and SVGO
            var DOMParser = new xmldom.DOMParser(),
                XMLSerializer = new xmldom.XMLSerializer(),
                XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null), // `document` alternative for NodeJS environments
                SVGOptimizer = new svgo(options.svgo);

            // Create SVG element
            var spritemap = XMLDoc.createElement('svg'),
                defs = XMLDoc.createElement('defs'),
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
                    width = parseFloat(svg.getAttribute('width')) || viewbox[2],
                    height = parseFloat(svg.getAttribute('height')) || viewbox[3];

                // Create symbol
                var symbol = XMLDoc.createElement('symbol');
                symbol.setAttribute('id', validId);

                // Add title for improved accessibility
                var title = XMLDoc.createElement('title');
                title.appendChild(XMLDoc.createTextNode(id));
                symbol.appendChild(title);

                // Clone the original contents of the SVG file into the new symbol
                while ( svg.childNodes.length > 0 ) {
                    symbol.appendChild(svg.childNodes[0]);
                }

                defs.appendChild(symbol);

                // Generate <use> elements within spritemap to allow usage within CSS
                var sprite = XMLDoc.createElement('use');
                sprite.setAttribute('xlink:href', '#' + validId);
                sprite.setAttribute('transform', 'translate(0, ' + sizes.height.reduce(function(a, b) { return a + b; }, 0) + ')');
                spritemap.appendChild(sprite);

                // Update sizes
                sizes.width.push(width);
                sizes.height.push(height);
            });

            // Adds defs to spritemap
            spritemap.insertBefore(defs, spritemap.firstChild);
            spritemap.setAttribute('width', Math.max.apply(null, sizes.width));
            spritemap.setAttribute('height', sizes.height.reduce(function(a, b) { return a + b; }, 0));

            // No point in optimizing/saving when there are no SVGs
            if ( !spritemap.childNodes.length ) {
                callback();
                return false;
            }

            // Transform Element to String and optimize SVG
            spritemap = XMLSerializer.serializeToString(spritemap);
            SVGOptimizer.optimize(spritemap, function(o) {
                // Insert the spritemap into the Webpack build as a new file asset
                compilation.assets[options.filename] = {
                    source: function() {
                        return o.data;
                    },
                    size: function() {
                        return o.data.length;
                    }
                };

                callback();
            });
        });
    });
};

module.exports = SVGSpritemapPlugin;
