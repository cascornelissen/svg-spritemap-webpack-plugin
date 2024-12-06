import fs from 'node:fs';
import path from 'node:path';
import { deleteSync } from 'del';

// Library
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import formatOptions from '../lib/options-formatter';
import SVGSpritemapPlugin from '../lib/';
import { VariablesWithInvalidDefaultsWarning } from '../lib/errors';

// Constants
const DEFAULT_OPTIONS = formatOptions();
const __dirname = new URL(import.meta.url + '/..').pathname;

it('Returns undefined when no spritemap is provided', () => {
    expect(generateStyles()).toEqual({});
});

it('Throws when an unsupported styles extension is provided', async () => {
    const spritemap = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], DEFAULT_OPTIONS);

    expect(() => {
        generateStyles(spritemap, {
            extension: 'a'
        })
    }).toThrow();
});

describe('CSS', () => {
    it('Generates styles', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'css'
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with passed attributes', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'css',
            keepAttributes: true
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with fragments', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'css',
            format: {
                type: 'fragment'
            }
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });
});

describe('SCSS', () => {
    it('Generates styles', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'scss'
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with passed attributes', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'scss',
            keepAttributes: true
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with fragments', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'scss',
            format: {
                type: 'fragment'
            }
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Includes a warning when an default value mismatch is found', async () => {
        const sprite = 'variables-default-value-mismatch';
        const input = path.resolve(__dirname, `input/svg/${sprite}.svg`);
        const warning = new VariablesWithInvalidDefaultsWarning(`sprite-${sprite}`, 'a', ['#f00', '#00f']);
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, `input/svg/${sprite}.svg`), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'scss'
        }, [{
            path: input
        }]).warnings).toEqual(expect.arrayContaining([warning]));
    });
});

describe('LESS', () => {
    it('Generates styles', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'less'
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with passed attributes', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'less',
            keepAttributes: true
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });

    it('Generates styles with fragments', async () => {
        const input = path.resolve(__dirname, 'input/svg/single.svg');
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(generateStyles(spritemap, {
            extension: 'less',
            format: {
                type: 'fragment'
            }
        }, [{
            path: input
        }]).content.trim()).toEqual(output);
    });
});

it('Creates a directory that does not exist and write styles spritemap content', () => {
    const styles = '/* test content */';
    const type = 'dir';
    const stylesPath = './tests/output/path-to/folder-that-does-not-exist/spritemap.scss';
    const instance = new SVGSpritemapPlugin({
        styles: stylesPath
    });

    deleteSync('./tests/output/path-to/');
    instance.writeStylesToDisk(styles, type);

    expect(fs.readFileSync(stylesPath).toString()).toBe(styles);
});
