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
        new SVGSpritemapPlugin('src/**/*.svg', {
            output: {
                // filename: path.join(svgSpritesPublicPath, 'sprites.svg'),
                svg4everybody: true,
            },
            sprite: {
                prefix: false,
                generate: {
                    use: true,
                    view: '-VIEWPOSTFIX',
                    symbol: '-SYMBOLPOSTFIX',
                },
            },
            styles: {
                format: 'fragment',
                // filename: '~sprites.scss',
                filename: path.join(__dirname, 'src/scss/_sprites.scss')
            },
        })
    ]
};
