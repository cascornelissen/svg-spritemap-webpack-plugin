import fs from 'fs';
import del from 'del';
import path from 'path';

// Library
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import SVGSpritemapPlugin from '../lib';
import { VariablesWithInvalidDefaultsWarning } from '../lib/errors';

it('Returns undefined when no spritemap is provided', () => {
    expect(generateStyles()).toBeUndefined();
});

it('Throws when an unsupported styles extension is provided', async () => {
    const spritemap = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }]);

    expect(() => {
        generateStyles(spritemap, {
            extension: 'a'
        })
    }).toThrow();
});

describe('CSS', () => {
    it('Generates styles', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'css'
        }).content.trim()).toBe(output);
    });

    it('Generates styles with passed attributes', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'css',
            keepAttributes: true
        }).content.trim()).toBe(output);
    });

    it('Generates styles with fragments', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.css'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'css',
            format: {
                type: 'fragment'
            }
        }).content.trim()).toBe(output);
    });
});

describe('SCSS', () => {
    it('Generates styles', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'scss'
        }).content.trim()).toBe(output);
    });

    it('Generates styles with passed attributes', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'scss',
            keepAttributes: true
        }).content.trim()).toBe(output);
    });

    it('Generates styles with fragments', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.scss'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'scss',
            format: {
                type: 'fragment'
            }
        }).content.trim()).toBe(output);
    });

    it('Includes a warning when an default value mismatch is found', async () => {
        const sprite = 'variables-default-value-mismatch';
        const warning = new VariablesWithInvalidDefaultsWarning(sprite, 'a', ['#f00', '#00f']);
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, `input/svg/${sprite}.svg`),
            content: fs.readFileSync(path.resolve(__dirname, `input/svg/${sprite}.svg`), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'scss'
        }).warnings).toEqual(expect.arrayContaining([warning]));
    });
});

describe('LESS', () => {
    it('Generates styles', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'less'
        }).content.trim()).toBe(output);
    });

    it('Generates styles with passed attributes', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-attributes.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'less',
            keepAttributes: true
        }).content.trim()).toBe(output);
    });

    it('Generates styles with fragments', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/styles/sprites-fragments.less'), 'utf-8').trim();
        const spritemap = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/single.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
        }]);

        expect(generateStyles(spritemap, {
            extension: 'less',
            format: {
                type: 'fragment'
            }
        }).content.trim()).toBe(output);
    });
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
