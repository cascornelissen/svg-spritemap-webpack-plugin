const fs = require('fs');
const path = require('path');
const merge = require('webpack-merge');
const xmldom = require('xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');

module.exports = (symbols = [], options = {}) => {
    options = merge({
        prefix: ''
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

        const selector = symbol.getAttribute('id').replace(options.prefix, '');
        const dataURI = svgToMiniDataURI(XMLSerializer.serializeToString(svg));

        return `'${selector}': "${dataURI}"`;
    });

    const sizes = symbols.map((symbol) => {
        const size = symbol.getAttribute('viewBox').split(' ').slice(2);
        const width = size[0];
        const height = size[1];
        const selector = symbol.getAttribute('id').replace(options.prefix, '');

        return `'${selector}': (\r\n        'width': ${width},\r\n        'height': ${height}\r\n    )`;
    });

    return fs.readFileSync(path.join(__dirname, '../templates/styles.scss'), 'utf8')
        .replace('/* SPRITES */', sprites.map((sprite) => `    ${sprite}`).join(',\n').trim())
        .replace('/* SPRITE SIZES */', sizes.map((size) => `    ${size}`).join(',\n').trim());
}
