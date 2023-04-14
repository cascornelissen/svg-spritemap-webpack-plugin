const xmldom = require('@xmldom/xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');
const generateSpritePrefix = require('../helpers/generate-sprite-prefix');
const pxToRem = require('../helpers/px-to-rem');
const { merge } = require('webpack-merge');

module.exports = (symbols = [], options = {}, sources = []) => {
    options = merge({
        prefix: '',
        prefixStylesSelectors: false,
        postfix: {
            symbol: '',
            view: ''
        },
        keepAttributes: false,
        includeDimensions: false,
        units: 'rem',
        format: {
            type: 'data',
            publicPath: ''
        },
        callback: (content) => content
    }, options);

    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

    const sprites = symbols.map((symbol, index) => {
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

        // Extract width/height from viewbox
        const size = symbol.getAttribute('viewBox').split(' ').slice(2);
        const width = options.units === 'rem' ? `${pxToRem(size[0])}rem` : `${size[0]}px`;
        const height = options.units === 'rem' ? `${pxToRem(size[1])}rem` : `${size[1]}px`;

        const prefix = generateSpritePrefix(options.prefix, sources[index].path);
        const selector = symbol.getAttribute('id').replace(prefix, '').replace(options.postfix.symbol, '');
        let content = ((svg) => {
            switch ( options.format.type ) {
                case 'data':
                    return ` background-image: url("${svgToMiniDataURI(XMLSerializer.serializeToString(svg))}");`;
                case 'fragment':
                    const postfix = typeof options.postfix.view === 'boolean' ? '' : options.postfix.view;
                    return ` background-image: url("${options.format.publicPath}#${prefix}${selector}${postfix}");`;
                default:
                    return '';
            }
        })(svg);

        if (options.includeDimensions || options.format.type === 'dimensions') {
            content += ` width: ${width}; height: ${height};`;
        }

        return `.${options.prefixStylesSelectors ? `${prefix}${selector}` : selector} {${content} }`;
    });

    return {
        warnings: [],
        content: options.callback(sprites.join('\n').trim())
    };
};
