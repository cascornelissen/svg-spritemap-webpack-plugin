import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import { stripVariables, findDefaultValueMismatches } from '../lib/variable-parser';

describe('General', () => {
    it('Strips variables from spritemap SVG', async () => {
        const output = fs.readFileSync(path.join(__dirname, 'output/svg/variables.svg'), 'utf-8').trim();
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-all.svg')
        ]);

        expect(stripVariables(svg)).toBe(output);
    });

    it('Detects default value mismatches', async () => {
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-default-value-mismatch.svg')
        ]);

        expect(findDefaultValueMismatches(svg)).toHaveLength(1);
    });
});

describe('Sass maps in styles', () => {
    it('Parses basic variables', async () => {
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-basic.svg')
        ]);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'a': '#f00'`));
    });

    it('Parses variable with empty default value', async () => {
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-default-value-empty.svg')
        ]);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'a': ''`));
    });

    it('Parses re-used variables', async () => {
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-multiple.svg')
        ]);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'b': '2'`));
    });

    it('Parses variable short notation', async () => {
        const svg = await generateSVG([
            path.join(__dirname, 'input/svg/variables-shorthand.svg')
        ]);

        const styles = generateStyles(svg, {
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining(`'stroke': '#00f'`));
    });
});
