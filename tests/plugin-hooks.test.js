import path from 'path';
import webpack from 'webpack';

// Library
import SVGSpritemapPlugin from '../lib/';

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
