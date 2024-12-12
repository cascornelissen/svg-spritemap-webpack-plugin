import xmldom from '@xmldom/xmldom';
import StyleFormatters from './style-formatters/index.js';
import { merge } from 'webpack-merge';

export default (spritemap, options = {}, sources = []) => {
    options = merge({
        extension: '',
        keepAttributes: false,
        prefix: '',
        prefixStylesSelectors: false,
        postfix: {
            symbol: '',
            view: ''
        },
        format: {
            type: 'data',
            publicPath: ''
        },
        variables: {
            sprites: 'sprites',
            sizes: 'sizes',
            variables: 'variables',
            mixin: 'sprite'
        },
        callback: (content) => content
    }, options);

    if ( !spritemap || !options.extension ) {
        return {};
    }

    // Parse SVG and extract <symbol> elements
    const DOMParser = new xmldom.DOMParser();
    const svg = DOMParser.parseFromString(spritemap).documentElement;
    const symbols = Array.from(svg.childNodes).filter((childNode) => childNode.nodeName === 'symbol');

    // Execute formatter
    const extension = options.extension.toLowerCase();
    const formatter = StyleFormatters[extension];
    if ( typeof formatter === 'undefined' ) {
        throw new Error(`Unsupported styles extension: ${extension}`);
    }

    return formatter(symbols, {
        prefix: options.prefix,
        prefixStylesSelectors: options.prefixStylesSelectors,
        postfix: options.postfix,
        keepAttributes: options.keepAttributes,
        format: options.format,
        variables: options.variables,
        callback: options.callback
    }, sources);
};
