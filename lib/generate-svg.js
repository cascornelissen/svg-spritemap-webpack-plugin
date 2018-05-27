const fs = require('fs');
const path = require('path');
const merge = require('webpack-merge');
const idify = require('html4-id');
const xmldom = require('xmldom');

module.exports = (files = [], options = {}) => {
    options = merge({
        gutter: 0,
        prefix: '',
        generateTitle: true
    }, options);

    // No point in generating when there are no files
    if ( !files.length ) {
        return;
    }

    // Initialize DOM/XML
    const DOMParser = new xmldom.DOMParser();
    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

    // Create SVG element
    const svg = XMLDoc.createElement('svg');
    let sizes = {
        width: [],
        height: []
    };

    // Add namespaces
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Add symbol for each file
    files.forEach((file) => {
        const id = `${options.prefix}${path.basename(file, path.extname(file))}`;
        const validId = idify(id);

        // Parse source SVG
        const contents = fs.readFileSync(file, 'utf8');
        const sprite = DOMParser.parseFromString(contents).documentElement;

        // Get sizes
        let viewbox = (sprite.getAttribute('viewBox') || sprite.getAttribute('viewbox')).split(' ').map((a) => parseFloat(a));
        let width = parseFloat(sprite.getAttribute('width'));
        let height = parseFloat(sprite.getAttribute('height'));

        if ( viewbox.length !== 4 && ( isNaN(width) || isNaN(height) ) ) {
            throw new Error(`Invalid SVG '${file}'; it's lacking both a viewBox and width/height attributes...`);
        }

        if ( viewbox.length !== 4 ) {
            viewbox = [0, 0, width, height];
        }

        if ( isNaN(width) ) {
            width = viewbox[2];
        }

        if ( isNaN(height) ) {
            height = viewbox[3];
        }

        // Create symbol
        const symbol = XMLDoc.createElement('symbol');
        symbol.setAttribute('id', validId);
        symbol.setAttribute('viewBox', viewbox.join(' '));

        if ( options.generateTitle ) {
            // Make sure we don't overwrite the existing title
            const hasTitle = (sprite) => {
                const titles = Array.from(sprite.childNodes).filter((childNode) => {
                    return childNode.nodeName.toLowerCase() === 'title';
                });

                return !!titles.length;
            };

            // Add title to improve accessibility
            if ( !hasTitle(sprite) ) {
                const title = XMLDoc.createElement('title');
                title.appendChild(XMLDoc.createTextNode(id.replace(options.prefix, '')));
                symbol.appendChild(title);
            }
        }

        // Clone the original contents of the SVG file into the new symbol
        Array.from(sprite.childNodes).forEach((childNode) => {
            symbol.appendChild(childNode);
        });

        svg.appendChild(symbol);

        // Generate <use> elements within spritemap to allow usage within CSS
        const use = XMLDoc.createElement('use');
        use.setAttribute('xlink:href', `#${validId}`);
        use.setAttribute('x', '0');
        use.setAttribute('y', sizes.height.reduce((a, b) => a + b, 0) + (sizes.height.length * options.gutter));
        use.setAttribute('width', width.toString());
        use.setAttribute('height', height.toString());
        svg.appendChild(use);

        // Update sizes
        sizes.width.push(width);
        sizes.height.push(height);
    });

    // Add width/height to spritemap
    svg.setAttribute('width', Math.max.apply(null, sizes.width).toString());
    svg.setAttribute('height', (sizes.height.reduce((a, b) => a + b, 0) + ((sizes.height.length - 1) * options.gutter)).toString());

    return XMLSerializer.serializeToString(svg);
}
