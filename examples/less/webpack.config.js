import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SVGSpritemapPlugin from '../..';

export default {
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
        new SVGSpritemapPlugin('src/sprites/*.svg', {
            sprite: {
                prefixStylesSelectors: true
            },
            styles: path.join(__dirname, 'src/less/sprites.less')
        })
    ]
};
