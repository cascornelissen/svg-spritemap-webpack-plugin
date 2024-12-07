import path from 'node:path';
import { optimize } from 'svgo/browser';
import xmldom from '@xmldom/xmldom';
import { svgElementAttributes } from 'svg-element-attributes';
import omit from 'lodash/omit';
import concat from 'lodash/concat';
import uniqBy from 'lodash/uniqBy';
import { merge } from 'webpack-merge';
import variableParser from './variable-parser';

// Helpers
import idify from './helpers/idify';
import calculateY from './helpers/calculate-y';
import generateSpritePrefix from './helpers/generate-sprite-prefix';
import generateSVGOConfig from './helpers/generate-svgo-config';

// Errors
import { SpriteParsingWarning } from './errors';

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

export default (sources = [], options = {}, warnings = []) => {
    options = merge({
        sprite: {
            prefix: '',
            idify: idify,
            gutter: 0,
            generate: {
                title: true,
                symbol: true,
                use: false,
                view: false,
                dimensions: false
            }
        },
        output: {
            svg: {
                sizes: false
            },
            svgo: {
                plugins: []
            }
        },
        input: {
            patterns: []
        }
    }, options);

    // No point in generating when there are no files
    if ( !sources.length ) {
        return;
    }

    // Initialize DOM/XML/SVGO
    const DOMParser = new xmldom.DOMParser();
    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

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
                warnings.push(new SpriteParsingWarning(`Sprite '${item.id}' has no documentElement.`));
                return;
            }

            return documentElement;
        } catch(error) {
            warnings.push(new SpriteParsingWarning(`Sprite '${item.id}' could not be parsed.\n${error}`));
        }
    }

    // Add namespaces
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if ( options.sprite.generate.use ) {
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    const items = sources.map((source) => {
        const prefix = generateSpritePrefix(options.sprite.prefix, source.path);
        const id = `${prefix}${options.sprite.idify(path.basename(source.path, path.extname(source.path)))}`;

        if ( options.output.svgo === false ) {
            return {
                id: id,
                sprite: source.content
            };
        }

        const sprite = (() => {
            if ( variableParser.hasVariables(source.content) && !variableParser.hasVarNamespace(source.content) ) {
                return variableParser.addVarNamespace(source.content);
            }

            return source.content;
        })();

        try {
            const config = generateSVGOConfig(merge({}, options.output.svgo, {
                path: source.path
            }), [],  [{
                name: 'removeEmptyAttrs',
                active: false // Prevent empty var:* attributes from getting removed prematurely
            }, {
                name: 'moveGroupAttrsToElems',
                active: false // Prevent groups from getting optimized prematurely as they may contain var:* attributes
            }, {
                name: 'collapseGroups',
                active: false // Prevent groups from getting removed prematurely as they may contain var:* attributes
            }, {
                name: 'removeTitle',
                active: false // Prevent titles from getting removed prematurely
            }]);

            const output = optimize(sprite, config);

            return {
                prefix: prefix,
                file: source.path,
                id: id,
                sprite: output.data
            };
        } catch (error) {
            warnings.push(new SpriteParsingWarning(`Sprite '${id}' could not be optimized.\n${error}`));
        }
    }).filter(Boolean)

    // Add the xmlns:var attribute when variables are found in any sprite
    if ( variableParser.hasVariables(items.map((item) => item.sprite).join('\n')) ) {
        svg.setAttribute(`xmlns:${variableParser.VAR_NAMESPACE}`, variableParser.VAR_NAMESPACE_VALUE);
    }

    items.forEach((item) => {
        if (!item.sprite.trim()) {
            warnings.push(new SpriteParsingWarning(`Sprite '${item.id}' has an empty source file.`));
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
            warnings.push(new SpriteParsingWarning(`Sprite '${item.id}' is invalid, it's lacking both a viewBox and width/height attributes.`));

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

            if ( options.sprite.generate.dimensions ) {
                symbol.setAttribute('height', height.toString());
                symbol.setAttribute('width', width.toString());
            }

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

    // Add custom attributes to spritemap
    Object.entries(options.output.svg.attributes).forEach(([name, value]) => {
        svg.setAttribute(name, value);
    });

    return XMLSerializer.serializeToString(svg);
};
