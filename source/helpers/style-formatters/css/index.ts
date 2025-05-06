// Helpers
import { formatSelector, formatURL, getSymbolSVG } from '../helpers.js';

// Constants
import { SPRITE_NAME_ATTRIBUTE, SPRITE_LOCATION_ATTRIBUTE } from '../../../constants.js';

// Types
import { StyleFormatter } from '../types.js';

const formatter: StyleFormatter = (symbols, options, compilation) => {
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

        return `.${formatSelector(name, location, options)} { background-image: url('${formatURL(name, location, svg, options, compilation)}'); }`;
    });

    return options.styles.callback(sprites.join('\n').trim());
};

export default formatter;
