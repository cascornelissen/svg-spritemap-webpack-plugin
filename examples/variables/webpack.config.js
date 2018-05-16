const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                'sass-loader'
            ]
        }]
    },

    plugins: [
        new MiniCssExtractPlugin('styles.css'),
        new SVGSpritemapPlugin({
            src: 'src/**/*.svg',
            styles: path.join(__dirname, 'src/scss/_sprites.scss')
        })
    ]
};
