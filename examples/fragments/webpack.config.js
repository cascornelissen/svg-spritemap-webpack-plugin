import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SVGSpritemapPlugin from '../../index.js';

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
                    sizes: false
                }
            },
            sprite: {
                generate: {
                    use: true,
                    view: '-fragment',
                    symbol: true
                }
            },
            styles: {
                format: 'fragment',
                filename: 'src/scss/_sprites.scss'
            }
        })
    ]
};
