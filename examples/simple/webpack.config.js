const SVGSpritemapPlugin = require('../..');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin('src/**/*.svg')
    ]
};
