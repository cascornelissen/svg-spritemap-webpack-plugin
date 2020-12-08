const fs = require('fs');
const path = require('path');
const svgo = require('svgo');
const xmldom = require('xmldom');
const svgElementAttributes = require('svg-element-attributes');
const { merge } = require('webpack-merge');
const { VAR_NAMESPACE, VAR_NAMESPACE_VALUE, hasVariables, hasVarNamespace, addVarNamespace } = require('./variable-parser');
const generateSpritePrefix = require('./helpers/generate-sprite-prefix');
const calculateY = require('./helpers/calculate-y');
const addWarning = require('./helpers/add-warning');
const { SpriteParsingWarning, NoSourceFilesWarning } = require('./errors');

const validSymbolAttributes = [
    ...svgElementAttributes['*'],
    ...svgElementAttributes.svg.filter(attr => svgElementAttributes.symbol.includes(attr))
];

const validViewAttributes = [
    ...svgElementAttributes['*'],
    ...svgElementAttributes.svg.filter(attr => svgElementAttributes.view.includes(attr))
];

const validUseAttributes = [
    ...svgElementAttributes['*'],
    ...svgElementAttributes.svg.filter(attr => svgElementAttributes.use.includes(attr))
];

module.exports = (sources = [], options = {}, compilation) => {
    options = merge({
        sprite: {
            prefix: '',
            idify: require('html4-id'),
            gutter: 0,
            generate: {
                title: true,
                symbol: true,
                use: false,
                view: false
            }
        },
        output: {
            svg: {
                sizes: false
            },
            svgo: {}
        },
        input: {
            patterns: []
        }
    }, options);

    return new Promise((resolve) => {
        // No point in generating when there are no files
        if ( !sources.length ) {
            addWarning(new NoSourceFilesWarning(options.input.patterns), compilation);
        }

        // Initialize DOM/XML/SVGO
        const DOMParser = new xmldom.DOMParser();
        const XMLSerializer = new xmldom.XMLSerializer();
        const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);
        const SVGOptimizer = new svgo(merge(options.output.svgo, {
            plugins: [{
                removeEmptyAttrs: false // Prevent empty var:* attributes from getting removed prematurely
            }, {
                moveGroupAttrsToElems: false // Prevent groups from getting optimized prematurely as they may contain var:* attributes
            }, {
                collapseGroups: false // Prevent groups from getting removed prematurely as they may contain var:* attributes
            }, {
                removeTitle: false // Prevent titles from getting removed prematurely
            }]
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

        const getDocumentElement = (item) => {
            try {
                const sprite = DOMParser.parseFromString(item.sprite);
                const documentElement = sprite.documentElement;

                if (!documentElement) {
                    addWarning(new SpriteParsingWarning(`Sprite '${item.id}' has no documentElement.`), compilation);
                    return;
                }

                return documentElement;
            } catch(error) {
                addWarning(new SpriteParsingWarning(`Sprite '${item.id}' could not be parsed.\n${error}`), compilation);
            }
        }

        // Add namespaces
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        if ( options.sprite.generate.use ) {
            svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        }

        Promise.all(sources.map((source) => new Promise((resolve) => {
            const prefix = generateSpritePrefix(options.sprite.prefix, source.path);
            const id = `${prefix}${options.sprite.idify(path.basename(source.path, path.extname(source.path)))}`;

            if ( options.output.svgo === false ) {
                return resolve({
                    id: id,
                    sprite: source.content
                });
            }

            const sprite = (() => {
                if ( hasVariables(source.content) && !hasVarNamespace(source.content) ) {
                    return addVarNamespace(source.content);
                }

                return source.content;
            })();

            SVGOptimizer.optimize(sprite, {
                path: source.path
            }).then((output) => resolve({
                prefix: prefix,
                file: source.path,
                id: id,
                sprite: output.data
            })).catch((error) => {
                addWarning(new SpriteParsingWarning(`Sprite '${id}' could not be optimized.\n${error}`), compilation);
                resolve();
            });
        }))).then((items) => {
            return items.filter(Boolean);
        }).then((items) => {
            // Add the xmlns:var attribute when variables are found in any sprite
            if ( hasVariables(items.map((item) => item.sprite).join('\n')) ) {
                svg.setAttribute(`xmlns:${VAR_NAMESPACE}`, VAR_NAMESPACE_VALUE);
            }

            items.forEach((item) => {
                if (!item.sprite.trim()) {
                    addWarning(new SpriteParsingWarning(`Sprite '${item.id}' has an empty source file.`), compilation);
                    return;
                }

                const documentElement = getDocumentElement(item);

                if (!documentElement) {
                    return;
                }

                // Attributes that should be transferred to output SVG
                const attributes = Array.from(documentElement.attributes).reduce((attributes, attribute) => {
                    // Blacklist several attributes as they'll be added/removed while parsing
                    if ( ['viewbox', 'width', 'height', 'id', 'xmlns'].includes(attribute.name.toLowerCase()) ) {
                        return attributes;
                    }

                    return [...attributes, {
                        name: attribute.name,
                        value: attribute.value
                    }];
                }, []);

                // Add xmlns:* attributes to root SVG
                attributes.forEach((attribute) => {
                    if ( !attribute.name.toLowerCase().startsWith('xmlns:') ) {
                        return;
                    }

                    svg.setAttribute(attribute.name, attribute.value);
                });

                // Get sizes
                let viewbox = (documentElement.getAttribute('viewBox') || documentElement.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
                let width = parseFloat(documentElement.getAttribute('width'));
                let height = parseFloat(documentElement.getAttribute('height'));

                if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
                    addWarning(new SpriteParsingWarning(`Sprite '${item.id}' is invalid, it's lacking both a viewBox and width/height attributes.`), compilation);

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
                if ( options.sprite.generate.symbol ) {
                    const symbol = XMLDoc.createElement('symbol');

                    // Attributes
                    attributes.forEach((attribute) => {
                        if ( !validSymbolAttributes.includes(attribute.name) ) {
                            return;
                        }

                        symbol.setAttribute(attribute.name, attribute.value);
                    });

                    symbol.setAttribute('id', `${item.id}${formatPostfix(options.sprite.generate.symbol)}`);
                    symbol.setAttribute('viewBox', viewbox.join(' '));
                    if ( options.sprite.generate.title ) {
                        // Make sure we don't overwrite the existing title
                        const hasTitle = (documentElement) => {
                            const titles = Array.from(documentElement.childNodes).filter((childNode) => {
                                return childNode.nodeName.toLowerCase() === 'title';
                            });

                            return !!titles.length;
                        };

                        // Add title to improve accessibility
                        if ( !hasTitle(documentElement) ) {
                            const title = XMLDoc.createElement('title');
                            title.appendChild(XMLDoc.createTextNode(item.id.replace(item.prefix, '')));
                            symbol.appendChild(title);
                        }
                    }

                    // Clone the original contents of the SVG file into the new symbol
                    Array.from(documentElement.childNodes).forEach((childNode) => {
                        symbol.appendChild(childNode);
                    });

                    svg.appendChild(symbol);
                }

                if ( options.sprite.generate.use ) {
                    // Generate <use> elements within spritemap to allow usage within CSS
                    const use = XMLDoc.createElement('use');
                    const y = calculateY(sizes.height, options.sprite.gutter);

                    // Attributes
                    attributes.forEach((attribute) => {
                        if ( !validUseAttributes.includes(attribute.name) ) {
                            return;
                        }

                        use.setAttribute(attribute.name, attribute.value);
                    });

                    use.setAttribute('xlink:href', `#${item.id}${formatPostfix(options.sprite.generate.symbol)}`);
                    use.setAttribute('x', '0');
                    use.setAttribute('y', y);
                    use.setAttribute('width', width.toString());
                    use.setAttribute('height', height.toString());
                    svg.appendChild(use);
                }

                if ( options.sprite.generate.view ) {
                    // Generate <view> elements within spritemap to allow usage within CSS
                    const view = XMLDoc.createElement('view');
                    const y = calculateY(sizes.height, options.sprite.gutter);

                    // Attributes
                    attributes.forEach((attribute) => {
                        if ( !validViewAttributes.includes(attribute.name) ) {
                            return;
                        }

                        view.setAttribute(attribute.name, attribute.value);
                    });

                    view.setAttribute('id', `${item.id}${formatPostfix(options.sprite.generate.view)}`);
                    view.setAttribute('viewBox', `0 ${Math.max(0, y - (options.sprite.gutter / 2))} ${width + (options.sprite.gutter / 2)} ${height + (options.sprite.gutter / 2)}`);
                    svg.appendChild(view);
                }

                // Update sizes
                sizes.width.push(width);
                sizes.height.push(height);
            });

            if ( options.output.svg.sizes ) {
                // Add width/height to spritemap
                svg.setAttribute('width', Math.max.apply(null, sizes.width).toString());
                svg.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * options.sprite.gutter)).toString());
            }

            return resolve(XMLSerializer.serializeToString(svg));
        });
    });
};
