import SVGSpritemapPlugin from '../../index.js';

const sprites = {
    a: '1',
    b: '2',
    d: '2',
    e: '3',
    c: '2'
};

export default {
    entry: 'data:text/javascript,',
    plugins: [
        new SVGSpritemapPlugin(Object.values(sprites).map((sprite) => {
            return `./src/sprites/${sprite}.svg`;
        }), {
            input: {
                allowDuplicates: true
            },
            sprite: {
                idify: (filename, index) => {
                    return Object.keys(sprites)[index];
                }
            }
        })
    ]
};
