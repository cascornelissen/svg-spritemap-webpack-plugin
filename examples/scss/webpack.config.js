const path = require('path');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            svgo: false,
            filename: 'spritemap.svg',
            styles: 'styles.scss',
            // styles: path.join(__dirname, 'src/scss/test.css')
        })
    ]
}
