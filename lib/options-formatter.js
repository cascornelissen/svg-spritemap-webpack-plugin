const path = require('path');
const { merge } = require('webpack-merge');

// Helpers
const idify = require('./helpers/idify');
const validateOptions = require('./options-validator');

// Constants
const DEFAULT_PATTERN = '**/*.svg';

module.exports = (pattern, options) => {
    // Make the first argument optional, just passing a configuration
    // object should result in the default pattern being used
    if ( typeof options === 'undefined' && (typeof pattern === 'object' && !Array.isArray(pattern) && pattern !== null) ) {
        options = pattern;
        pattern = DEFAULT_PATTERN;
    } else if ( typeof pattern === 'undefined' && typeof options === 'undefined' ) {
        pattern = DEFAULT_PATTERN;
    }

    // Validate input
    validateOptions(pattern, options);

    // Format output (`null` values will be overwritten below the object initialization)
    const output = merge({
        input: {
            options: {},
            allowDuplicates: false
        },
        output: {
            filename: 'spritemap.svg',
            svg: {
                sizes: null,
                attributes: {}
            },
            chunk: {
                name: 'spritemap',
                keep: false
            },
            svg4everybody: false,
            svgo: true
        },
        sprite: {
            prefix: 'sprite-',
            prefixStylesSelectors: false,
            idify: idify,
            gutter: 0,
            generate: {
                title: true,
                symbol: true,
                use: false,
                view: false
            }
        },
        styles: false
    }, options || {}, {
        input: {
            patterns: typeof pattern === 'string' ? [pattern] : pattern
        }
    });

    // [output.svg.sizes] If no option is specified base this on the `sprite.generate.use` option
    if ( output.output.svg.sizes === null ) {
        output.output.svg.sizes = output.sprite.generate.use;
    }

    // [output.svgo] If enabled by by passing `true`, set it to an empty object
    if ( output.output.svgo === true ) {
        output.output.svgo = {
            plugins: []
        };
    }

    if ( output.output.svgo ) {
        output.output.svgo = merge({
            plugins: []
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

    // [sprite.idify] If disabled by passing `false`, set it to a function that returns the input
    if ( output.sprite.idify === false ) {
        output.sprite.idify = (value) => value;
    }

    // [sprite.gutter] Reformat `false` to 0
    if ( output.sprite.gutter === false ) {
        output.sprite.gutter = 0;
    }

    if ( output.styles ) {
        if ( typeof output.styles === 'string' ) {
            output.styles = {
                filename: output.styles
            };
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
