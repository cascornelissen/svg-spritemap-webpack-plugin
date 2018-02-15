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

it('Does not overwrite the SVGO cleanupIDs plugin', () => {
    const plugin = new SVGSpritemapPlugin({
        svgo: {
            plugins: [{
                cleanupIDs: 'a'
            }]
        }
    });

    expect(plugin.options.svgo.plugins).not.toContainEqual({
        cleanupIDs: 'a'
    });
});
