const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'sass-loader']
                })
            }
        ]
    },

    plugins: [
        new ExtractTextPlugin('styles.css'),
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            styles: path.join(__dirname, 'src/scss/_sprites.scss')
        })
    ]
}
