const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin('src/**/*.svg')
    ]
};
