// Helpers
import { getTemplate } from '../../template.js';
import { formatSelector, formatURL, getSymbolSVG } from '../helpers.js';

// Constants
import { SPRITE_LOCATION_ATTRIBUTE, SPRITE_NAME_ATTRIBUTE } from '../../../constants.js';

// Types
import { StyleFormatter } from '../types.js';

const formatter: StyleFormatter = (symbols, options, compilation) => {
    const template = getTemplate('styles.less');
    const sprites = symbols.map((symbol) => {
        const name = symbol.getAttribute(SPRITE_NAME_ATTRIBUTE);
        const location = symbol.getAttribute(SPRITE_LOCATION_ATTRIBUTE);

        if (!name) {
            throw new Error(`Sprite name attribute '${SPRITE_NAME_ATTRIBUTE}' is missing on symbol.`);
        }

        if (!location) {
            throw new Error(`Sprite location attribute '${SPRITE_LOCATION_ATTRIBUTE}' is missing on symbol ${name}.`);
        }

        const svg = getSymbolSVG(symbol, options);

        return `@${formatSelector(name, location, options)}: "${formatURL(name, location, svg, options, compilation)}";`;
    });

    const output = [{
        name: 'SPRITES',
        value: sprites.join('\n').trim()
    }].reduce((output, replacement) => {
        return output.replaceAll(`/* ${replacement.name} */`, replacement.value);
    }, template);

    return options.styles.callback(output);
};

export default formatter;
