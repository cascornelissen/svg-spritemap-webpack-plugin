const path = require('path');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            svgo: false,
            filename: 'spritemap.svg',
            styles: 'styles.css',
            // styles: path.join(__dirname, 'src/scss/test.css')
        })
    ]
}
