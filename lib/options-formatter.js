const path = require('path');
const merge = require('webpack-merge');
const validateOptions = require('./options-validator');

// Constants
const DEFAULT_PATTERN = '**/*.svg';

module.exports = (pattern, options) => {
    // Make the first argument optional, just passing a configuration
    // object should result in the default pattern being used
    if ( typeof options === 'undefined' && (typeof pattern === 'object' && pattern !== null) ) {
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
            options: {}
        },
        output: {
            filename: 'spritemap.svg',
            svg: {
                sizes: null
            },
            chunk: {
                name: 'spritemap',
                delete: true
            },
            svg4everybody: false,
            svgo: true
        },
        sprite: {
            prefix: 'sprite-',
            idify: require('html4-id'), // TODO [MAJOR]: Replace this with a function that returns a valid HTML5 id (https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute)
            gutter: 0,
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

    // [input.patterns] Normalize the patterns to make sure the correct slashes are used
    output.input.patterns = output.input.patterns.map((pattern) => path.normalize(pattern));

    // [output.svg.sizes] If no option is specified base this on the `sprite.generate.use` option
    if ( output.output.svg.sizes === null ) {
        output.output.svg.sizes = output.sprite.generate.use;
    }

    // [output.svgo] If enabled by by passing `true`, set it to an empty object
    if ( output.output.svgo === true ) {
        output.output.svgo = {};
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
