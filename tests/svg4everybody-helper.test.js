import SVGSpritemapPlugin from '../lib/';

it('Supports an entry type of \'string\'', () => {
    expect(() => {
        global.__WEBPACK__({
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
        global.__WEBPACK__({
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

it('Supports an entry type of \'object\' with string values', () => {
    expect(() => {
        global.__WEBPACK__({
            entry: {
                a: './webpack/index.js'
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

it('Supports an entry type of \'object\' with array values', () => {
    expect(() => {
        global.__WEBPACK__({
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
        global.__WEBPACK__({
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

it('Throws when an entry to which the svg4everybody helper will be added is of an unsupported type ', () => {
    expect(() => {
        global.__WEBPACK__({
            entry: () => {},
            plugins: [
                new SVGSpritemapPlugin({
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        });
    }).toThrow('Unsupported entry type');
});

it('Throws when a sub-entry to which the svg4everybody helper will be added is of an unsupported type', () => {
    expect(() => {
        global.__WEBPACK__({
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
    }).toThrow(/(Unsupported sub-entry type|Invalid configuration object)/);
});
