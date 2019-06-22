import webpack from 'webpack';

// Library
import SVGSpritemapPlugin from '../lib/';

it('Supports an entry type of \'string\'', () => {
    expect(() => {
        webpack({
            entry: './webpack/index.js',
            plugins: [
                new SVGSpritemapPlugin({
                    output: {
                        svg4everybody: true
                    }
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
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        });
    }).not.toThrow();
});

it('Supports an entry type of \'object\'', () => {
    expect(() => {
        webpack({
            entry: {
                a: ['./webpack/index.js']
            },
            plugins: [
                new SVGSpritemapPlugin({
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        });
    }).not.toThrow();
});

it('Throws when the entry to which the svg4everybody helper will be added is of an unsupported type', () => {
    expect(() => {
        webpack({
            entry: () => {},
            plugins: [
                new SVGSpritemapPlugin({
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        });
    }).toThrow();
});

it('Throws when a sub-entry to which the svg4everybody helper will be added is of an unsupported type', () => {
    expect(() => {
        webpack({
            entry: {
                a: () => {}
            },
            plugins: [
                new SVGSpritemapPlugin({
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        });
    }).toThrow();
});
