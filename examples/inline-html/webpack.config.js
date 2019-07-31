const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    plugins: [
        new SVGSpritemapPlugin('src/**/*.svg'),
        new HtmlWebpackPlugin({
            title: 'Example: inline-html',
            template: path.resolve(__dirname, 'src/index.ejs')
        })
    ]
};
