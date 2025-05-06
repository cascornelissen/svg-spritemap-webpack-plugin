import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SVGSpritemapPlugin from '../../index.js';

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
        new SVGSpritemapPlugin('src/sprites/*.svg', {
            styles: {
                filename: 'src/less/sprite.less',
                selectors: {
                    prefix: true
                }
            }
        }),
        new MiniCssExtractPlugin({
            filename: 'styles.css'
        })
    ]
};
