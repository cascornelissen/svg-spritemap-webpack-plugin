import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SVGSpritemapPlugin from '../..';

export default {
    module: {
        rules: [{
            test: /\.scss$/,
            use: [{
                loader: MiniCssExtractPlugin.loader
            }, {
                loader: 'css-loader',
                options: {
                    url: false
                }
            }, {
                loader: 'sass-loader'
            }]
        }]
    },

    plugins: [
        new HtmlWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        }),
        new SVGSpritemapPlugin('src/sprites/*.svg', {
            output: {
                svg: {
                    // Disable `width` and `height` attributes on the root SVG element
                    // as these will skew the sprites when using the <view> via fragment identifiers
                    sizes: false
                }
            },
            sprite: {
                generate: {
                    // Generate <use> tags within the spritemap as the <view> tag will use this
                    use: true,

                    // Generate <view> tags within the svg to use in css via fragment identifier url
                    // and add -fragment suffix for the identifier to prevent naming collisions with the symbol identifier
                    view: '-fragment',

                    // Generate <symbol> tags within the SVG to use in HTML via <use> tag
                    symbol: true
                },
            },
            styles: {
                // Specify that we want to use URLs with fragment identifiers in a styles file as well
                format: 'fragment',

                // Path to the styles file, note that this method uses the `output.publicPath` webpack option
                // to generate the path/URL to the spritemap itself so you might have to look into that
                filename: path.join(__dirname, 'src/scss/_sprites.scss')
            }
        })
    ]
};
