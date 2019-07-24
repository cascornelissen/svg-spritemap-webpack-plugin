import path from 'path';
import webpack from 'webpack';

// Library
import SVGSpritemapPlugin from '../lib/';
import fs from "fs";

it('Should not add anything when no SVGs are found and generateSVG() returns nothing', (done) => {
    webpack({
        entry: path.resolve(__dirname, './webpack/index.js'),
        plugins: [
            new SVGSpritemapPlugin([], {})
        ]
    }, (error, stats) => {
        expect(stats.toJson().chunks).toHaveLength(1);
        expect(stats.toJson().assets).toHaveLength(1);
        expect(stats.toJson().assetsByChunkName['spritemap']).toBeUndefined();
        done();
    });
});

it('Should not optimize the spritemap when the \'output.svgo\' option is \'false\'', (done) => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/single-without-svgo.svg'), 'utf-8').trim();

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
        expect(stats.compilation.assets['spritemap.svg'].source()).toEqual(output);
        done();
    });
});
