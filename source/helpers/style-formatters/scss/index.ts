import webpack from 'webpack';
import { compact } from 'lodash-es';

// Helpers
import { indent } from '../../string.js';
import { getTemplate } from '../../template.js';
import { formatSelector, formatURL, getSymbolSVG } from '../helpers.js';
import { findDefaultVariableValueMismatches, findUniqueVariables } from '../../variables.js';
import { SVG_SERIALIZER } from '../../svg.js';

// Constants
import { SPRITE_LOCATION_ATTRIBUTE, SPRITE_NAME_ATTRIBUTE } from '../../../constants.js';

// Types
import { StyleFormatter } from '../types.js';

const formatter: StyleFormatter = (symbols, options, compilation) => {
    const template = getTemplate('styles.scss');
    const sprites = symbols.reduce<Record<string, string[]>>((output, symbol) => {
        const name = symbol.getAttribute(SPRITE_NAME_ATTRIBUTE);
        const location = symbol.getAttribute(SPRITE_LOCATION_ATTRIBUTE);
        const [width, height] = symbol.getAttribute('viewBox')?.split(' ').slice(2) ?? [];

        if (!name) {
            throw new Error(`Sprite name attribute '${SPRITE_NAME_ATTRIBUTE}' is missing on symbol.`);
        }

        if (!location) {
            throw new Error(`Sprite location attribute '${SPRITE_LOCATION_ATTRIBUTE}' is missing on symbol ${name}.`);
        }

        if (!width || !height) {
            throw new Error(`Sprite width/height could not be determined for symbol ${name}.`);
        }

        const svg = getSymbolSVG(symbol, options);
        const sprite = SVG_SERIALIZER.serializeToString(svg);
        const selector = formatSelector(name, location, options);
        const variables = findUniqueVariables(sprite).map((variable) => {
            return `'${variable.name}': '${variable.value}'`;
        });

        findDefaultVariableValueMismatches(sprite).forEach((mismatch) => {
            compilation.warnings.push(new webpack.WebpackError(`Default variable value mismatch for '${mismatch.name}': ${mismatch.values.join(', ')}`));
        });

        return {
            sprites: [
                ...output.sprites,
                `'${selector}': "${formatURL(name, location, svg, options, compilation)}"`
            ],
            sizes: [
                ...output.sizes,
                `'${selector}': (\n${indent(2)}'width': ${width}px,\n${indent(2)}'height': ${height}px\n${indent()})`
            ],
            variables: [
                ...output.variables,
                variables.length ? `'${selector}': (\n${indent(2)}${variables.join(`,\n${indent(2)}`)}\n${indent()})` : ''
            ]
        };
    }, {
        sprites: [],
        sizes: [],
        variables: []
    });

    const output = [{
        name: 'VAR_SPRITES',
        value: options.styles.variables.sprites
    }, {
        name: 'VAR_SIZES',
        value: options.styles.variables.sizes
    }, {
        name: 'VAR_VARIABLES',
        value: options.styles.variables.variables
    }, {
        name: 'VAR_MIXIN',
        value: options.styles.variables.mixin
    }, {
        name: 'SPRITES',
        value: compact(sprites.sprites).map((sprite) => {
            return [
                indent(),
                sprite
            ].join('');
        }).join(',\n').trim()
    }, {
        name: 'SIZES',
        value: compact(sprites.sizes).map((size) => {
            return [
                indent(),
                size
            ].join('');
        }).join(',\n').trim()
    }, {
        name: 'VARIABLES',
        value: compact(sprites.variables).map((variable) => {
            return [
                indent(),
                variable
            ].join('');
        }).join(',\n').trim()
    }].reduce((output, replacement) => {
        return output.replaceAll(`/* ${replacement.name} */`, replacement.value || '/* EMPTY */');
    }, template);

    return options.styles.callback(output);
};

export default formatter;
