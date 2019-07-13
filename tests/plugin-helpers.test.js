import SVGSpritemapPlugin from '../lib/';

// Helpers
import calculateY from '../lib/helpers/calculate-y';

it('Should return the original filename when no hashes are passed to hashFilename()', () => {
    const filename = 'test';
    expect(new SVGSpritemapPlugin().hashFilename(filename)).toEqual(filename);
});

it('Should return an empty array when no compilation is passed to getSpritemapHashes()', () => {
    expect(new SVGSpritemapPlugin().getSpritemapHashes()).toEqual([]);
});

it('Should return an empty array when no compilation is passed to getStylesHashes()', () => {
    expect(new SVGSpritemapPlugin().getStylesHashes()).toEqual([]);
});

it('Should calculate the Y position correctly', () => {
    expect(calculateY()).toEqual(0);
    expect(calculateY([1, 2, 3])).toEqual(6);
    expect(calculateY([1, 2, 3], 2)).toEqual(12);
});
