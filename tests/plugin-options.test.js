import SVGSpritemapPlugin from '../lib/';

it('Throws when something other than a plain object is supplied for the options parameter', () => {
    expect(() => {
        new SVGSpritemapPlugin(null, null)
    }).toThrow();
});

it('Throws when an invalid configuration is supplied', () => {
    expect(() => {
        new SVGSpritemapPlugin({
            a: 'a'
        })
    }).toThrow();
});

it('Merges supplied options into the options object', () => {
    const plugin = new SVGSpritemapPlugin({
        output: {
            filename: 'a'
        }
    });

    expect(plugin.options.output.filename).toBe('a');
});

it('Throws when the SVGO cleanupIDs plugin gets overwritten', () => {
    expect(() => {
        new SVGSpritemapPlugin({
            svgo: {
                plugins: [{
                    cleanupIDs: true
                }]
            }
        });
    }).toThrow();
});
