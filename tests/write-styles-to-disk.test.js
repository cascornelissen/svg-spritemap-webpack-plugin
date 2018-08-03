import fs from 'fs';
import del from 'del';
import SVGSpritemapPlugin from '../lib/';

it('Should create folder that is not exist and write styles spritemap content', () => {
    const styles = '/* test content */';
    const type = 'dir';
    const stylesPath = './tests/output/path-to/folder-that-is-not-exist/spritemap.scss';
    const instance = new SVGSpritemapPlugin({
        styles: stylesPath
    });

    del.sync('./tests/output/path-to/');
    instance.writeStylesToDisk(styles, type);

    expect(fs.readFileSync(stylesPath).toString()).toBe(styles);
});
