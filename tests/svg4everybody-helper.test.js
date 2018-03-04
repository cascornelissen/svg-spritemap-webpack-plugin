import webpack from 'webpack';
import SVGSpritemapPlugin from '../lib/';

it('Throws when the entry to which the svg4everybody helper will be added is of an unsupported type', () => {
    expect(() => {
        webpack({
            entry: () => {},
            plugins: [
                new SVGSpritemapPlugin({
                    svg4everybody: true
                })
            ]
        });
    }).toThrow();
});

it('Supports an entry type of \'string\'', () => {
    expect(() => {
        webpack({
            entry: './webpack/index.js',
            plugins: [
                new SVGSpritemapPlugin({
                    svg4everybody: true
                })
            ]
        });
    }).not.toThrow();
});

it('Supports an entry type of \'array\'', () => {
    expect(() => {
        webpack({
            entry: ['./webpack/index.js'],
            plugins: [
                new SVGSpritemapPlugin({
                    svg4everybody: true
                })
            ]
        });
    }).not.toThrow();
});

it('Supports an entry type of \'object\'', () => {
    expect(() => {
        webpack({
            entry: {
                test: ['./webpack/index.js']
            },
            plugins: [
                new SVGSpritemapPlugin({
                    svg4everybody: true
                })
            ]
        });
    }).not.toThrow();
});
