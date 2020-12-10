import os from 'os';
import fs from 'fs';
import path from 'path';
import SVGSpritemapPlugin from '../lib/';

// Helpers
import calculateY from '../lib/helpers/calculate-y';

it('Should calculate the Y position correctly', () => {
    expect(calculateY()).toEqual(0);
    expect(calculateY([1, 2, 3])).toEqual(6);
    expect(calculateY([1, 2, 3], 2)).toEqual(12);
});

it('Should always add base directories to the directories cache, even when no files are found', () => {
    const plugin = new SVGSpritemapPlugin('pattern/that/**/does-not-match/anything');
    plugin.updateDependencies();

    expect(plugin.files).toEqual([]);
    expect(plugin.directories).toEqual([path.resolve('pattern/that/')]);
});

it('Does not update the styles file when the content has not been updated', () => {
    const content = 'abc';
    const file = path.resolve(os.tmpdir(), 'svg-spritemap-test.css');
    fs.writeFileSync(file, content);
    const plugin = new SVGSpritemapPlugin({
        styles: file
    });

    expect(plugin.writeStylesToDisk(content, 'dir')).toBeUndefined();
});
