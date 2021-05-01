const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('../..');

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
        new SVGSpritemapPlugin('src/**/*.svg', {
            styles: path.join(__dirname, 'src/scss/_sprites.scss')
        }),
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        })
    ]
};
