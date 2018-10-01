const merge = require('webpack-merge');
const validateOptions = require('./options-validator');

module.exports = (pattern, options) => {
    // Make the first argument optional, just passing a configuration
    // object should result in the default pattern being used
    if ( typeof options === 'undefined' && (typeof pattern === 'object' && pattern !== null) ) {
        options = pattern;
        pattern = '**/*.svg'
    }

    // Validate input
    validateOptions(pattern, options);

    // Format output
    const output = merge({
        input: {
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
                symbol: true,
                use: false,
                view: false
            }
        },
        styles: false
    }, options, {
        input: {
            patterns: typeof pattern === 'string' ? [pattern] : pattern
        }
    });

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

    if ( output.styles ) {
        if ( typeof output.styles === 'string' ) {
            output.styles = {
                filename: output.styles
            }
        } else if ( output.styles === true ) {
            output.styles = {};
        }

        output.styles = merge({
            filename: '~sprites.css',
            format: 'data',
            variables: {
                sprites: 'sprites',
                sizes: 'sizes',
                variables: 'variables',
                mixin: 'sprite'
            }
        }, output.styles);
    }

    return output;
};
