import path from 'path';

// Library
import SVGSpritemapPlugin from '../lib/';

it('Should not optimize the spritemap when the \'output.svgo\' option is \'false\'', (done) => {
    global.__WEBPACK__({
        entry: path.resolve(__dirname, './webpack/index.js'),
        plugins: [
            new SVGSpritemapPlugin(path.resolve(__dirname, 'input/svg/single.svg'), {
                output: {
                    svgo: false
                },
                sprite: {
                    prefix: false
                }
            })
        ]
    }, (error, stats) => {
        expect(stats.compilation.assets['spritemap.svg'].size()).toEqual(200);
        done();
    });
});
