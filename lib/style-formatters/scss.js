import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import xmldom from '@xmldom/xmldom';
import svgToMiniDataURI from 'mini-svg-data-uri';
import generateSpritePrefix from '../helpers/generate-sprite-prefix.js';
import { merge } from 'webpack-merge';

// Helpers
import variableParser from '../variable-parser.js';

// Errors & Warnings
import { VariablesWithInvalidDefaultsWarning } from '../errors/index.js';

// Variables
const indent = (columns = 1, indentation = 4) => {
    return ' '.repeat(columns * indentation);
};

// Constants
const __dirname = dirname(fileURLToPath(import.meta.url));

export default (symbols = [], options = {}, sources = []) => {
    options = merge({
        prefix: '',
        prefixStylesSelectors: false,
        postfix: {
            symbol: '',
            view: ''
        },
        keepAttributes: false,
        format: {
            type: 'data',
            publicPath: ''
        },
        variables: {
            sprites: 'sprites',
            variables: 'variables',
            sizes: 'sizes',
            mixin: 'sprite'
        },
        callback: (content) => content
    }, options);

    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

    const output = symbols.reduce((accumulator, symbol, index) => {
        const svg = XMLDoc.createElement('svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Clone attributes to svg
        if ( options.keepAttributes ) {
            Array.from(symbol.attributes).forEach((attribute) => {
                if ( ['width', 'height', 'id', 'xmlns'].includes(attribute.name.toLowerCase()) ) {
                    return;
                }

                svg.setAttribute(attribute.name, attribute.value);
            });
        }

        // Clone symbol contents to svg
        Array.from(symbol.childNodes).forEach((childNode) => {
            if ( ['title'].includes(childNode.nodeName.toLowerCase()) ) {
                return;
            }

            svg.appendChild(childNode);
        });

        const sprite = XMLSerializer.serializeToString(svg);
        const prefix = generateSpritePrefix(options.prefix, sources[index].path);
        const selector = symbol.getAttribute('id').replace(prefix, '').replace(options.postfix.symbol, '');

        // Extract width/height from viewbox
        const size = symbol.getAttribute('viewBox').split(' ').slice(2);
        const width = size[0];
        const height = size[1];

        // Validate the current sprite
        const warnings = variableParser.findDefaultValueMismatches(sprite).map((mismatch) => {
            return new VariablesWithInvalidDefaultsWarning(selector, mismatch.name, mismatch.values);
        });

        // Find unique variables and map them to SCSS format
        const variables = variableParser.findUniqueVariables(sprite).map((variable) => {
            return `'${variable.name}': '${variable.value}'`
        });

        const content = ((sprite) => {
            switch ( options.format.type ) {
                case 'data':
                    return svgToMiniDataURI(variableParser.rewriteVariables(sprite, (name, attribute) => {
                        return `${attribute}="___${name}___"`;
                    }));
                case 'fragment':
                    const postfix = typeof options.postfix.view === 'boolean' ? '' : options.postfix.view;
                    return `${options.format.publicPath}#${prefix}${selector}${postfix}`;
            }
        })(sprite);

        return Object.assign({}, accumulator, {
            sprites: [
                ...accumulator.sprites,
                `'${options.prefixStylesSelectors ? `${prefix}${selector}` : selector}': "${content}"`
            ],
            sizes: [
                ...accumulator.sizes,
                `'${options.prefixStylesSelectors ? `${prefix}${selector}` : selector}': (\n${indent(2)}'width': ${width}px,\n${indent(2)}'height': ${height}px\n${indent()})`
            ],
            variables: [
                ...accumulator.variables,
                variables.length ? `'${options.prefixStylesSelectors ? `${prefix}${selector}` : selector}': (\n${indent(2)}${variables.join(`,\n${indent(2)}`)}\n${indent()})` : false
            ],
            warnings: [
                ...accumulator.warnings,
                ...warnings
            ]
        });
    }, {
        sprites: [],
        sizes: [],
        variables: [],
        warnings: []
    });

    return {
        warnings: output.warnings,
        content: options.callback(fs.readFileSync(path.join(__dirname, '../templates/styles.scss'), 'utf8')
            .replace(/\/\* VAR_SPRITES \*\//g, options.variables.sprites.trim())
            .replace(/\/\* VAR_SIZES \*\//g, options.variables.sizes.trim())
            .replace(/\/\* VAR_VARIABLES \*\//g, options.variables.variables.trim())
            .replace(/\/\* VAR_MIXIN \*\//g, options.variables.mixin.trim())
            .replace(/\/\* SPRITES \*\//g, output.sprites.map((sprite) => `${indent()}${sprite}`).join(',\n').trim() || '/* EMPTY */')
            .replace(/\/\* SIZES \*\//g, output.sizes.filter(Boolean).map((size) => `${indent()}${size}`).join(',\n').trim() || '/* EMPTY */')
            .replace(/\/\* VARIABLES \*\//g, output.variables.filter(Boolean).map((variable) => `${indent()}${variable}`).join(',\n').trim() || '/* EMPTY */'))
    };
};
