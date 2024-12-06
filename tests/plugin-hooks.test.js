import { fileURLToPath } from 'url';
import path from 'node:path';
import webpack from 'webpack';

// Library
import SVGSpritemapPlugin from '../lib/';

// Constants
const __dirname = new URL(import.meta.url + '/..').pathname;

it('Should not optimize the spritemap when the \'output.svgo\' option is \'false\'', (done) => {
    webpack({
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
