const fs = require('fs');
const path = require('path');
const merge = require('webpack-merge');
const xmldom = require('xmldom');
const svgToMiniDataURI = require('mini-svg-data-uri');
const { findUniqueVariables, rewriteVariables } = require('../variable-parser');

// Variables
const INDENT = '    ';

module.exports = (symbols = [], options = {}) => {
    options = merge({
        prefix: ''
    }, options);

    const XMLSerializer = new xmldom.XMLSerializer();
    const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

    const output = symbols.reduce((accumulator, symbol) => {
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

        // Parse variables
        const sprite = XMLSerializer.serializeToString(svg);
        const variables = findUniqueVariables(sprite).map((variable) => {
            const value = svgToMiniDataURI(variable.value).replace('data:image/svg+xml,', '');
            return `"${variable.name}": "${value}"`
        });

        const selector = symbol.getAttribute('id').replace(options.prefix, '');
        const dataURI = svgToMiniDataURI(rewriteVariables(sprite, (name, attribute) => {
            return `${attribute}="___${name}___"`;
        }));

        return Object.assign({}, accumulator, {
            sprites: [...accumulator.sprites, `'${selector}': "${dataURI}"`],
            variables: [...accumulator.variables, `'${selector}': (\n${INDENT}${INDENT}${variables.join(`,\n${INDENT}${INDENT}`)}\n${INDENT})`]
        });
    }, {
        sprites: [],
        variables: []
    });

    return fs.readFileSync(path.join(__dirname, '../templates/styles.scss'), 'utf8')
        .replace('/* SPRITES */', output.sprites.map((sprite) => `${INDENT}${sprite}`).join(',\n').trim())
        .replace('/* VARIABLES */', output.variables.map((variable) => `${INDENT}${variable}`).join(',\n').trim());
};
