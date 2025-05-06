import SVGSpritemapPlugin from '../../index.js';

export default {
    entry: 'data:text/javascript,',
    plugins: [
        new SVGSpritemapPlugin('src/sprites/*.svg')
    ]
};
