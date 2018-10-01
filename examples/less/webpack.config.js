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
        new MiniCssExtractPlugin('styles.css'),
        new SVGSpritemapPlugin('src/**/*.svg', {
            sprite: {
                generate: {
                    use: true,
                    view: true
                }
            },
            styles: {
                filename: path.join(__dirname, 'src/less/sprites.less'),
                format: 'fragment'
            }
        })
    ]
};
