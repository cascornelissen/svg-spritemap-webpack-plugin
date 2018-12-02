const fs = require('fs');
const path = require('path');
const svgo = require('svgo');
const merge = require('webpack-merge');
const idify = require('html4-id');
const xmldom = require('xmldom');
const { VAR_NAMESPACE, VAR_NAMESPACE_VALUE, hasVariables, hasVarNamespace, addVarNamespace } = require('./variable-parser');

module.exports = (files = [], options = {}) => {
    options = merge({
        gutter: 0,
        prefix: '',
        generate: {
            title: true, // TODO: Default this to false (to match the use option) and show a warning when title is true and use is false
            symbol: true,
            use: false,
            view: false
        },
        svgo: {}
    }, options);

    return new Promise((resolve, reject) => {
        // No point in generating when there are no files
        if ( !files.length ) {
            return resolve();
        }

        // Initialize DOM/XML/SVGO
        const DOMParser = new xmldom.DOMParser();
        const XMLSerializer = new xmldom.XMLSerializer();
        const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);
        const SVGOptimizer = new svgo(merge(options.svgo, {
            plugins: [
                // Prevent empty var:* attributes from getting removed prematurely
                { removeEmptyAttrs: false },

                // Prevent groups from getting optimized prematurely as they may contain var:* attributes
                { moveGroupAttrsToElems: false },
                { moveGroupAttrsToElems: false },
                { collapseGroups: false }
            ]
        }));

        // Create SVG element
        const svg = XMLDoc.createElement('svg');
        const sizes = {
            width: [],
            height: []
        };

        const formatPostfix = (value) => {
            if ( typeof value === 'string' ) {
                return value;
            }

            return '';
        };

        // Add namespaces
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute(`xmlns:${VAR_NAMESPACE}`, VAR_NAMESPACE_VALUE); // TODO: Only add this when variables are found in any of the sprites
        if ( options.generate.use ) {
            svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        }

        // Add elements for each file
        Promise.all(files.map((file) => new Promise((resolve, reject) => {
            const id = `${options.prefix}${idify(path.basename(file, path.extname(file)))}`;

            // Parse source SVG
            ((sprite) => {
                if ( options.svgo === false ) {
                    return Promise.resolve(sprite);
                }

                // Add a `xmlns:var` attribute to the SVG when variables are found
                // SVGO won't be able to parse the SVG otherwise
                if ( hasVariables(sprite) && !hasVarNamespace(sprite) ) {
                    sprite = addVarNamespace(sprite);
                }

                return SVGOptimizer.optimize(sprite).then((output) => output.data);
            })(fs.readFileSync(file, 'utf8')).then((contents) => {
                const sprite = DOMParser.parseFromString(contents).documentElement;

                // Get sizes
                let viewbox = (sprite.getAttribute('viewBox') || sprite.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
                let width = parseFloat(sprite.getAttribute('width'));
                let height = parseFloat(sprite.getAttribute('height'));

                if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
                    reject(`Invalid SVG '${file}'; it's lacking both a viewBox and width/height attributes...`);
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
                if ( options.generate.symbol ) {
                    const symbol = XMLDoc.createElement('symbol');
                    symbol.setAttribute('id', `${id}${formatPostfix(options.generate.symbol)}`);
                    symbol.setAttribute('viewBox', viewbox.join(' '));

                    if ( options.generate.title ) {
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
                            title.appendChild(XMLDoc.createTextNode(id.replace(options.prefix, '')));
                            symbol.appendChild(title);
                        }
                    }

                    // Clone the original contents of the SVG file into the new symbol
                    Array.from(sprite.childNodes).forEach((childNode) => {
                        symbol.appendChild(childNode);
                    });

                    svg.appendChild(symbol);
                }

                if ( options.generate.use ) {
                    // Generate <use> elements within spritemap to allow usage within CSS
                    const use = XMLDoc.createElement('use');
                    const y = sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * options.gutter);

                    use.setAttribute('xlink:href', `#${id}${formatPostfix(options.generate.symbol)}`);
                    use.setAttribute('x', '0');
                    use.setAttribute('y', y);
                    use.setAttribute('width', width.toString());
                    use.setAttribute('height', height.toString());
                    svg.appendChild(use);
                }

                if ( options.generate.view ) {
                    // Generate <view> elements within spritemap to allow usage within CSS
                    const view = XMLDoc.createElement('view');
                    const y = sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * options.gutter);

                    view.setAttribute('id', `${id}${formatPostfix(options.generate.view)}`);
                    view.setAttribute('viewBox', `0 ${Math.max(0, y - (options.gutter / 2))} ${width + (options.gutter / 2)} ${height + (options.gutter / 2)}`);
                    svg.appendChild(view);
                }

                // Update sizes
                sizes.width.push(width);
                sizes.height.push(height);

                resolve();
            });
        }))).then(() => {
            if ( options.generate.use ) {
                // Add width/height to spritemap
                svg.setAttribute('width', Math.max.apply(null, sizes.width).toString());
                svg.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * options.gutter)).toString());
            }

            return resolve(XMLSerializer.serializeToString(svg));
        }).catch(reject);
    });
};
