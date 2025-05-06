import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SVGSpritemapPlugin from '../../index.js';

export default {
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
        new SVGSpritemapPlugin('src/sprites/*.svg', {
            styles: {
                filename: 'src/scss/_sprite.scss'
            }
        }),
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        })
    ]
};
