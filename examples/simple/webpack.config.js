const SVGSpritemapPlugin = require('../../svg-spritemap');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg'
        })
    ]
}
