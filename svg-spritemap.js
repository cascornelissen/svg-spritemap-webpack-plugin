var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    svgo = require('svgo'),
    xmldom = require('xmldom');

function SVGSpritemapPlugin(options) {
    // Merge specified options with default options
    this.options = _.merge({}, {
        src: '**/*.svg',
        svgo: {},
        glob: {},
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
            var spritemap = XMLDoc.createElement('svg');
            spritemap.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Add symbol for each file
            files.forEach(function(file) {
                var id = path.basename(file, path.extname(file));

                // Parse source SVG
                var contents = fs.readFileSync(file, 'utf8'),
                    svg = DOMParser.parseFromString(contents).documentElement;

                // Create symbol
                var symbol = XMLDoc.createElement('symbol');
                symbol.setAttribute('id', id);
                symbol.setAttribute('viewBox', svg.getAttribute('viewBox') || svg.getAttribute('viewbox'));

                // Add title for improved accessability
                var title = XMLDoc.createElement('title');
                title.appendChild(XMLDoc.createTextNode(id));
                symbol.appendChild(title);

                // Clone the original contents of the SVG file into the new symbol
                while ( svg.childNodes.length > 0 ) {
                    symbol.appendChild(svg.childNodes[0]);
                }

                spritemap.appendChild(symbol);
            });

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
