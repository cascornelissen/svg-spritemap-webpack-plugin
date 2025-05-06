import webpack from 'webpack';
import xmldom from '@xmldom/xmldom';
import svgToMiniDataURI from 'mini-svg-data-uri';
import { compact } from 'lodash-es';

// Helpers
import { rewriteVariables } from '../variables.js';
import { generatePostfix, generatePrefix, SVG_SERIALIZER } from '../svg.js';

// Types
import { OptionsWithStyles } from '../../types.js';

export const formatSelector = (name: string, location: string, options: OptionsWithStyles) => {
    return compact([
        options.styles.selectors.prefix && generatePrefix(location, options),
        name
    ]).join('');
};

export const formatURL = (name: string, location: string, svg: xmldom.Element, options: OptionsWithStyles, compilation: webpack.Compilation, rewrite = false) => {
    switch (options.styles.format) {
        case 'data': {
            if (rewrite) {
                return svgToMiniDataURI(rewriteVariables(SVG_SERIALIZER.serializeToString(svg), (variable) => {
                    return `${variable.attribute}="___${variable.name}___"`;
                }));
            }

            return svgToMiniDataURI(SVG_SERIALIZER.serializeToString(svg));
        }
        case 'fragment': {
            return compact([
                compilation.options.output.publicPath,
                '#',
                generatePrefix(location, options),
                name,
                generatePostfix(options.sprite.generate.view)
            ]).join('');
        }
    }
};

export const getSymbolSVG = (symbol: xmldom.Element, options: OptionsWithStyles) => {
    const document = new xmldom.DOMImplementation().createDocument('http://www.w3.org/2000/svg', '');
    const svg = document.createElement('svg');

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if (options.styles.attributes.keep) {
        [...symbol.attributes].forEach((attribute) => {
            if (['width', 'height', 'id', 'xmlns'].includes(attribute.name.toLowerCase())) {
                return;
            }

            svg.setAttribute(attribute.name, attribute.value);
        });
    }

    [...symbol.childNodes].forEach((node) => {
        if (['title'].includes(node.nodeName.toLowerCase())) {
            return;
        }

        svg.appendChild(node);
    });

    return svg;
};
