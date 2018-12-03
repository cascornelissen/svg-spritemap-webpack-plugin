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
            sprite: {
                generate: {
                    // Generate <use> tags within the spritemap as the <view> tag will use this
                    use: true,

                    // Generate <view> tags within the svg to use in css via fragment identifier url
                    // and add -fragment suffix for the identifier to prevent naming colissions with the symbol identifier
                    view: '-fragment',

                    // Generate <symbol> tags within the SVG to use in HTML via <use> tag
                    symbol: true
                },
            },
            styles: {
                // Specifiy that we want to use URLs with fragment identifiers in a styles file as well
                format: 'fragment',

                // Path to the styles file, note that this method uses the `output.publicPath` webpack option
                // to generate the path/URL to the spritemap itself so you might have to look into that
                filename: path.join(__dirname, 'src/scss/_sprites.scss')
            }
        })
    ]
};
