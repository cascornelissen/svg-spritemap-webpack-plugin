import fs from 'fs';
import del from 'del';
import path from 'path';
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import SVGSpritemapPlugin from '../lib';

it('Returns undefined when no spritemap is provided', () => {
    expect(generateStyles()).toBeUndefined();
});

it('Throws when an unsupported styles extension is provided', async () => {
    const spritemap = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ]);

    expect(() => {
        generateStyles(spritemap, {
            extension: 'a'
        })
    }).toThrow();
});

it('Generates CSS styles', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.css'), 'utf-8').trim();
    const spritemap = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ]);

    expect(generateStyles(spritemap, {
        extension: 'css'
    }).content.trim()).toBe(output);
});

it('Generates SCSS styles', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.scss'), 'utf-8').trim();
    const spritemap = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ]);

    expect(generateStyles(spritemap, {
        extension: 'scss'
    }).content.trim()).toBe(output);
});

it('Generates LESS styles', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.less'), 'utf-8').trim();
    const spritemap = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ]);

    expect(generateStyles(spritemap, {
        extension: 'less'
    }).content.trim()).toBe(output);
});

it('Creates a directory that does not exist and write styles spritemap content', () => {
    const styles = '/* test content */';
    const type = 'dir';
    const stylesPath = './tests/output/path-to/folder-that-does-not-exist/spritemap.scss';
    const instance = new SVGSpritemapPlugin({
        styles: stylesPath
    });

    del.sync('./tests/output/path-to/');
    instance.writeStylesToDisk(styles, type);

    expect(fs.readFileSync(stylesPath).toString()).toBe(styles);
});
