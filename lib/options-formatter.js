const merge = require('webpack-merge');
const validateOptions = require('./options-validator');

module.exports = (input = {}) => {
    validateOptions(input);

    const output = merge({
        input: {
            pattern: '**/*.svg',
            options: {}
        },
        output: {
            filename: 'spritemap.svg',
            chunk: {
                name: 'spritemap',
                delete: true
            },
            svg4everybody: false,
            svgo: true
        },
        sprite: {
            prefix: 'sprite-',
            gutter: 2,
            generate: {
                title: true,
                use: false,
                view: false
            }
        },
        styles: false
    }, ((input) => {
        if ( typeof input !== 'string' && !Array.isArray(input) ) {
            return input;
        }

        // Transform string or string[] input to the correct object schema
        return {
            input: {
                pattern: input
            }
        };
    })(input));

    // [input.pattern] Force input pattern to array
    if ( typeof output.input.pattern === 'string' ) {
        output.input.pattern = [output.input.pattern];
    }

    // [output.svgo] If enabled by by passing `true`, set it to an empty object
    if ( output.output.svgo === true ) {
        output.output.svgo = {};
    }

    // [output.svgo] Always disable the SVGO cleanupIDs plugin
    if ( output.output.svgo ) {
        output.output.svgo = merge({
            plugins: [{
                cleanupIDs: false
            }]
        }, output.output.svgo);
    }

    // [output.svg4everybody] If enabled by by passing `true`, set it to an empty object
    if ( output.output.svg4everybody === true ) {
        output.output.svg4everybody = {};
    }

    // [sprite.prefix] If disabled by passing `false`, set it to an empty string
    if ( output.sprite.prefix === false ) {
        output.sprite.prefix = '';
    }

    // [sprite.gutter] Reformat `false` to 0
    if ( output.sprite.gutter === false ) {
        output.sprite.gutter = 0;
    }

    return output;
};
