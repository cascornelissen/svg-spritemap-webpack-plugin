import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import xmldom from '@xmldom/xmldom';
import svgToMiniDataURI from 'mini-svg-data-uri';
import generateSpritePrefix from '../helpers/generate-sprite-prefix.js';
import { merge } from 'webpack-merge';

// Constants
const __dirname = dirname(fileURLToPath(import.meta.url));

export default (symbols = [], options = {}, sources = []) => {
    options = merge({
        prefix: '',
        prefixStylesSelectors: false,
        postfix: {
            symbol: '',
            view: ''
        },
        keepAttributes: false,
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

        const prefix = generateSpritePrefix(options.prefix, sources[index].path);
        const selector = symbol.getAttribute('id').replace(prefix, '').replace(options.postfix.symbol, '');
        const content = ((svg) => {
            switch ( options.format.type ) {
                case 'data':
                    return svgToMiniDataURI(XMLSerializer.serializeToString(svg));
                case 'fragment':
                    const postfix = typeof options.postfix.view === 'boolean' ? '' : options.postfix.view;
                    return `${options.format.publicPath}#${prefix}${selector}${postfix}`;
            }
        })(svg);

        return `@${options.prefixStylesSelectors ? `${prefix}${selector}` : selector}: "${content}";`;
    });

    return {
        warnings: [],
        content: options.callback(fs.readFileSync(path.join(__dirname, '../templates/styles.less'), 'utf8').replace('/* SPRITES */', sprites.join('\n').trim()))
    };
};
