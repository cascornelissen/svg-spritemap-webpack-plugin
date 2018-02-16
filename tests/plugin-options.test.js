import SVGSpritemapPlugin from '../svg-spritemap';

it('Throws when something other than a plain object is supplied for the options parameter', () => {
    expect(() => {
        new SVGSpritemapPlugin('')
    }).toThrow();
});

it('Merges supplied options into the options object', () => {
    const plugin = new SVGSpritemapPlugin({
        a: 'a'
    });

    expect(plugin.options.a).toBe('a');
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
