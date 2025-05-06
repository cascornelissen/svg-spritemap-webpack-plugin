import HtmlWebpackPlugin from 'html-webpack-plugin';
import SVGSpritemapPlugin from '../../index.js';

export default {
    entry: 'data:text/javascript,',
    plugins: [
        new SVGSpritemapPlugin('src/sprites/*.svg'),
        new HtmlWebpackPlugin({
            title: 'Example: inline-html',
            template: 'src/index.ejs'
        })
    ]
};
