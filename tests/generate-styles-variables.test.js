import fs from 'fs';
import path from 'path';

// Library
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import formatOptions from '../lib/options-formatter';
import { stripVariables, findDefaultValueMismatches } from '../lib/variable-parser';

// Constants
const DEFAULT_OPTIONS = formatOptions();

describe('General', () => {
    it('Strips variables from spritemap SVG', async () => {
        const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/variables.svg'), 'utf-8').trim();
        const svg = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/variables-all.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-all.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(stripVariables(svg)).toEqual(output);
    });

    it('Detects default value mismatches', async () => {
        const svg = await generateSVG([{
            path: path.resolve(__dirname, 'input/svg/variables-default-value-mismatch.svg'),
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-default-value-mismatch.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        expect(findDefaultValueMismatches(svg)).toHaveLength(1);
    });
});

describe('Sass maps in styles', () => {
    it('Parses basic variables', async () => {
        const input = path.resolve(__dirname, 'input/svg/variables-basic.svg');
        const svg = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-basic.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }, [{
            path: input
        }]).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'a': '#f00'`));
    });

    it('Parses variable with empty default value', async () => {
        const input = path.resolve(__dirname, 'input/svg/variables-default-value-empty.svg');
        const svg = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-default-value-empty.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }, [{
            path: input
        }]).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'a': ''`));
    });

    it('Parses re-used variables', async () => {
        const input = path.resolve(__dirname, 'input/svg/variables-multiple.svg');
        const svg = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-multiple.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }, [{
            path: input
        }]).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'b': '2'`));
    });

    it('Parses variable short notation', async () => {
        const input = path.resolve(__dirname, 'input/svg/variables-shorthand.svg');
        const svg = await generateSVG([{
            path: input,
            content: fs.readFileSync(path.resolve(__dirname, 'input/svg/variables-shorthand.svg'), 'utf-8')
        }], DEFAULT_OPTIONS);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }, [{
            path: input
        }]).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'stroke': '#00f'`));
    });
});
