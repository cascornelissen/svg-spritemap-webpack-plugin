const merge = require('webpack-merge');
const xmldom = require('xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');

module.exports = (symbols = [], options = {}) => {
    options = merge({
        prefix: '',
        postfix: {
            symbol: '',
            view: ''
        },
        format: {
            type: 'data',
            publicPath: ''
        }
    }, options);

    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

    const sprites = symbols.map((symbol) => {
        const svg = XMLDoc.createElement('svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));

        // Clone symbol contents to svg
        Array.from(symbol.childNodes).forEach((childNode) => {
            if ( ['title'].includes(childNode.nodeName.toLowerCase()) ) {
                return;
            }

            svg.appendChild(childNode);
        });

        const selector = symbol.getAttribute('id').replace(options.postfix.symbol, '');
        const content = ((svg) => {
            switch ( options.format.type ) {
                case 'data':
                    return svgToMiniDataURI(XMLSerializer.serializeToString(svg));
                case 'fragment':
                    const postfix = typeof options.postfix.view === 'boolean' ? '' : options.postfix.view;
                    return `${options.format.publicPath}#${options.prefix}${selector}${postfix}`;
            }
        })(svg);

        return `.${selector} { background-image: url("${content}"); }`;
    });

    return {
        warnings: [],
        content: sprites.join('\n')
    };
};
