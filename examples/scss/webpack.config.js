const path = require('path');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            svgo: false,
            svg4everybody: true,
            filename: 'spritemap.[hash].[contenthash].svg',
            styles: 'test.[hash].[contenthash].css',
            // styles: path.join(__dirname, 'src/scss/test.css')
        })
    ]
}
