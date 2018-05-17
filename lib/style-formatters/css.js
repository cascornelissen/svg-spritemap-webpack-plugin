const xmldom = require('xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');

module.exports = (symbols = []) => {
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

        const selector = symbol.getAttribute('id');
        const dataURI = svgToMiniDataURI(XMLSerializer.serializeToString(svg));

        return `.${selector} { background-image: url("${dataURI}"); }`;
    });

    return {
        content: sprites.join('\n'),
        warnings: []
    };
};
