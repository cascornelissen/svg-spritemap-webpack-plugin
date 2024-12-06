import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SVGSpritemapPlugin from '../..';

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
            styles: path.join(__dirname, 'src/scss/_sprites.scss')
        }),
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        })
    ]
};
