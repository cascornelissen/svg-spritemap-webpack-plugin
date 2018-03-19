const path = require('path');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            svgo: false,
            svg4everybody: true,
            filename: 'spritemap.[hash].svg',
            styles: 'test.css',
            // styles: path.join(__dirname, 'src/scss/test.css')
        })
    ]
}
