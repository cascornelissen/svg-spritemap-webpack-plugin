const fs = require('fs');
const path = require('path');
const xmldom = require('xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');
const { merge } = require('webpack-merge');

module.exports = (symbols = [], options = {}) => {
    options = merge({
        prefix: '',
        postfix: {
            symbol: '',
            view: ''
        },
        keepAttributes: false,
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

        const selector = symbol.getAttribute('id').replace(options.postfix.symbol, '');
        const content = ((svg) => {
            switch ( options.format.type ) {
                case 'data':
                    return svgToMiniDataURI(XMLSerializer.serializeToString(svg));
                case 'fragment':
                    const postfix = typeof options.postfix.view === 'boolean' ? '' : options.postfix.view;
                    return `${options.format.publicPath}#${selector}${postfix}`;
            }
        })(svg);

        return `@${selector}: "${content}";`;
    });

    return {
        warnings: [],
        content: fs.readFileSync(path.join(__dirname, '../templates/styles.less'), 'utf8')
            .replace('/* SPRITES */', sprites.join('\n').trim())
    };
};
