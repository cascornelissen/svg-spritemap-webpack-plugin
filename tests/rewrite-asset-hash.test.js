import SVGSpritemapPlugin from '../lib/';

it('Returns undefined when no options were passed', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.rewriteAssetsHashes()).toBeUndefined();
});

it('Rewrites assets hashes', () => {
    const plugin = new SVGSpritemapPlugin();
    const filename = 'spritemap.[hash].svg';
    const assets = {
        [filename]: '__CONTENT__'
    };
    const hashes = [{
        pattern: /\[hash]/,
        value: '__HASH__'
    }];

    expect(plugin.rewriteAssetsHashes(filename, assets, hashes)).toEqual({
        filename: 'spritemap.__HASH__.svg',
        assets: {
            'spritemap.__HASH__.svg': '__CONTENT__'
        }
    });
});

it('Leaves asset names untouched when no hashes are present in the filename', () => {
    const plugin = new SVGSpritemapPlugin();
    const filename = 'spritemap.svg';
    const assets = {
        [filename]: '__CONTENT__'
    };
    const hashes = [{
        pattern: /\[hash]/,
        value: '__HASH__'
    }];

    expect(plugin.rewriteAssetsHashes(filename, assets, hashes)).toEqual({
        filename: 'spritemap.svg',
        assets: {
            'spritemap.svg': '__CONTENT__'
        }
    });
});

