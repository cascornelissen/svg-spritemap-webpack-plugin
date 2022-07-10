const SVGSpritemapPlugin = require('../..');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin('src/sprites/*.svg')
    ]
};
