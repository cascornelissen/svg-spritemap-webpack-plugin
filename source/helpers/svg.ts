import path from 'node:path';
import webpack from 'webpack';
import xmldom from '@xmldom/xmldom';
import { merge } from 'webpack-merge';
import { optimize, Config } from 'svgo';
import { compact, isEmpty, map, sum } from 'lodash-es';
import { svgElementAttributes } from 'svg-element-attributes';

// Helpers
import { addVariablesNamespace, hasVariables } from './variables.js';

// Constants
import { SPRITE_NAME_ATTRIBUTE, SPRITE_LOCATION_ATTRIBUTE, VAR_NAMESPACE, VAR_NAMESPACE_VALUE } from '../constants.js';

// Types
import { Options } from '../types.js';

export const SVG_PARSER = new xmldom.DOMParser();
export const SVG_SERIALIZER = new xmldom.XMLSerializer();

export const generateSVG = (sources: Record<number, string[]>, options: Options, warnings: webpack.WebpackError[]) => {
    const sizes: Record<string, number[]> = {
        width: [],
        height: [],
        gutter: []
    };

    if (isEmpty(sources)) {
        return;
    }

    const document = new xmldom.DOMImplementation().createDocument('http://www.w3.org/2000/svg', '');
    const svg = document.createElement('svg');
    const items = compact(Object.entries(sources).map(([index, [location, source]]) => {
        return {
            location,
            id: generateIdentifier(location, options),
            name: generateName(location, options),
            title: generateTitle(location),
            content: generateSprite(source)
        };
    }));

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if (options.sprite.generate.use) {
        svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    if (hasVariables(map(items, 'content'))) {
        svg.setAttribute(`xmlns:${VAR_NAMESPACE}`, VAR_NAMESPACE_VALUE);
    }

    Object.entries(options.output.svg.attributes).forEach(([name, value]) => {
        svg.setAttribute(name, value);
    });

    for (const item of items) {
        if (!item.content.trim()) {
            warnings.push(new webpack.WebpackError(`Sprite '${item.location}' has an empty source file.`));
            continue;
        }

        const documentElement = getDocumentElement(item.content);

        if (!documentElement) {
            warnings.push(new webpack.WebpackError(`Sprite '${item.location}' does not have a valid document element.`));
            continue;
        }

        const attributes = getDocumentElementAttributes(documentElement, ['viewbox', 'width', 'height', 'id', 'xmlns', SPRITE_LOCATION_ATTRIBUTE]);

        for (const [name, value] of Object.entries(attributes)) {
            if (!name.toLowerCase().startsWith('xmlns:')) {
                continue;
            }

            svg.setAttribute(name, value);
        }

        let width = Number.parseFloat(getDocumentElementAttribute(documentElement, 'width') ?? '');
        let height = Number.parseFloat(getDocumentElementAttribute(documentElement, 'height') ?? '');
        let viewbox = getDocumentElementAttribute(documentElement, 'viewbox')?.split(' ').map((value) => {
            return Number.parseFloat(value);
        });

        if (viewbox?.length !== 4 && (Number.isNaN(width) || Number.isNaN(height))) {
            warnings.push(new webpack.WebpackError(`Sprite '${item.location}' is invalid, it's lacking both a valid viewbox and width/height attributes.`));

            continue;
        }

        if (viewbox?.length !== 4) {
            viewbox = [0, 0, width, height];
        }

        if (Number.isNaN(width)) {
            width = viewbox[2]; // eslint-disable-line unicorn/prefer-at
        }

        if (Number.isNaN(height)) {
            height = viewbox[3]; // eslint-disable-line unicorn/prefer-at
        }

        const y = sum([...sizes.height, ...sizes.gutter, options.sprite.gutter]);

        if (options.sprite.generate.symbol) {
            const symbol = generateElement('symbol', document, attributes);

            symbol.setAttribute(SPRITE_NAME_ATTRIBUTE, item.name);
            symbol.setAttribute(SPRITE_LOCATION_ATTRIBUTE, item.location);
            symbol.setAttribute('viewBox', viewbox.join(' '));
            symbol.setAttribute('id', [
                item.id,
                generatePostfix(options.sprite.generate.symbol)
            ].join(''));

            if (options.sprite.generate.dimensions) {
                symbol.setAttribute('height', height.toString());
                symbol.setAttribute('width', width.toString());
            }

            if (options.sprite.generate.title) {
                const hasTitle = [...documentElement.childNodes].some((node) => {
                    return node.nodeName === 'title';
                });

                if (!hasTitle) {
                    const title = document.createElement('title');

                    title.appendChild(document.createTextNode(item.title));
                    symbol.appendChild(title);
                }
            }

            [...documentElement.childNodes].forEach((node) => {
                symbol.appendChild(node);
            });

            svg.appendChild(symbol);
        }

        if (options.sprite.generate.use) {
            const use = generateElement('use', document, attributes);

            use.setAttribute('x', '0');
            use.setAttribute('y', y.toString());
            use.setAttribute('width', width.toString());
            use.setAttribute('height', height.toString());
            use.setAttribute('xlink:href', [
                '#',
                item.id,
                generatePostfix(options.sprite.generate.symbol)
            ].join(''));

            svg.appendChild(use);
        }

        if (options.sprite.generate.view) {
            const view = generateElement('view', document, attributes);

            view.setAttribute('id', [
                item.id,
                generatePostfix(options.sprite.generate.view)
            ].join(''));
            view.setAttribute('viewBox', [
                0,
                Math.max(0, y - (options.sprite.gutter / 2)),
                width + (options.sprite.gutter / 2),
                height + (options.sprite.gutter / 2)
            ].join(' '));

            svg.appendChild(view);
        }

        sizes.width.push(width);
        sizes.height.push(height);
        sizes.gutter.push(options.sprite.gutter);
    }

    if (options.output.svg.sizes) {
        svg.setAttribute('width', Math.max(...sizes.width).toString());
        svg.setAttribute('height', sum([...sizes.height, ...sizes.gutter]).toString());
    }

    return SVG_SERIALIZER.serializeToString(svg);
};

export const cleanSVG = (content: string): string => {
    return [
        SPRITE_NAME_ATTRIBUTE,
        SPRITE_LOCATION_ATTRIBUTE
    ].reduce((content, attribute) => {
        return content.replaceAll(new RegExp(`\\s*${attribute}="[^"]*"`, 'g'), '');
    }, content);
};

export const optimizeSVG = (content: string, options: Options): string => {
    const svg = cleanSVG(content);

    if (!options.output.svgo) {
        return svg;
    }

    const configuration = merge<Config>({
        plugins: [{
            name: 'preset-default',
            params: {
                overrides: {
                    cleanupIds: false,
                    removeHiddenElems: false
                }
            }
        }]
    }, options.output.svgo === true ? {} : options.output.svgo);

    return optimize(svg, configuration).data;
};

const getDocumentElement = (content: string) => {
    try {
        return SVG_PARSER.parseFromString(content, 'image/svg+xml').documentElement ?? undefined;
    } catch {
        return;
    }
};

const getDocumentElementAttribute = (documentElement: xmldom.Element, name: string) => {
    return [...documentElement.attributes].find((attribute) => {
        return attribute.name.toLowerCase() === name.toLowerCase();
    })?.value;
};

const getDocumentElementAttributes = (documentElement: xmldom.Element, exclusions: string[] = []): Record<string, string> => {
    return [...documentElement.attributes].reduce((attributes, attribute) => {
        if (exclusions.includes(attribute.name.toLowerCase())) {
            return attributes;
        }

        return {
            ...attributes,
            [attribute.name]: attribute.value
        };
    }, {});
};

const getValidAttributes = (tagName: string) => {
    return [
        ...svgElementAttributes['*'],
        ...svgElementAttributes.svg.filter((attribute) => {
            return svgElementAttributes[tagName].includes(attribute);
        })
    ];
};

export const generatePrefix = (location: string, options: Options) => {
    if (typeof options.sprite.prefix === 'function') {
        return options.sprite.prefix(location);
    }

    return options.sprite.prefix;
};

export const generatePostfix = (value: string | boolean | undefined) => {
    if (typeof value === 'string') {
        return value;
    }

    return '';
};

const generateTitle = (location: string) => {
    return path.basename(location, path.extname(location));
};

const generateName = (location: string, options: Options): string => {
    const title = generateTitle(location);

    if (!options.sprite.idify) {
        return title;
    }

    return options.sprite.idify(title);
};

const generateIdentifier = (location: string, options: Options) => {
    return compact([
        generatePrefix(location, options),
        generateName(location, options)
    ]).join('');
};

const generateSprite = (content: string) => {
    if (hasVariables(content)) {
        return addVariablesNamespace(content);
    }

    return content;
};

const generateElement = (tagName: string, document: xmldom.Document, attributes: Record<string, string>) => {
    const element = document.createElement(tagName);

    for (const [name, value] of Object.entries(attributes)) {
        if (!getValidAttributes(tagName).includes(name)) {
            continue;
        }

        element.setAttribute(name, value);
    }

    return element;
};
