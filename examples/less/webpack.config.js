const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    module: {
        rules: [{
            test: /\.less$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader', 'less-loader']
            })
        }]
    },

    plugins: [
        new ExtractTextPlugin('styles.css'),
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            styles: path.join(__dirname, 'src/less/sprites.less')
        })
    ]
};
