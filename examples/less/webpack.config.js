const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SVGSpritemapPlugin = require('../../lib');

module.exports = {
    module: {
        rules: [{
            test: /\.less$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                'less-loader'
            ]
        }]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        }),
        new SVGSpritemapPlugin('src/**/*.svg', {
            styles: path.join(__dirname, 'src/less/sprites.less')
        })
    ]
};
