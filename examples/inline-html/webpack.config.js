import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SVGSpritemapPlugin from '../..';

export default {
    plugins: [
        new SVGSpritemapPlugin('src/sprites/*.svg'),
        new HtmlWebpackPlugin({
            title: 'Example: inline-html',
            template: path.resolve(__dirname, 'src/index.ejs')
        })
    ]
};
