import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';
import { stripVariables, findDefaultValueMismatches } from '../lib/variable-parser';

// Variables
const PREFIX = 'sprite-';

describe('General', () => {
    it('Strips variables from spritemap SVG', () => {
        const output = fs.readFileSync(path.join(__dirname, 'output/svg/variables.svg'), 'utf-8').trim();
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-all.svg')
        ], {
            prefix: PREFIX
        });

        expect(stripVariables(svg)).toBe(output);
    });

    it('Detects default value mismatches', () => {
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-default-value-mismatch.svg')
        ], {
            prefix: PREFIX
        });

        expect(findDefaultValueMismatches(svg)).toHaveLength(1);
    });
});

describe('Sass maps in styles', () => {
    it('Parses basic variables', () => {
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-basic.svg')
        ], {
            prefix: PREFIX
        });

        const styles = generateStyles(svg, {
            prefix: PREFIX,
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining('"a": "red"'));
    });

    it('Parses variable with empty default value', () => {
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-default-value-empty.svg')
        ], {
            prefix: PREFIX
        });

        const styles = generateStyles(svg, {
            prefix: PREFIX,
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining('"a": ""'));
    });

    it('Parses re-used variables', () => {
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-multiple.svg')
        ], {
            prefix: PREFIX
        });

        const styles = generateStyles(svg, {
            prefix: PREFIX,
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining('"b": "2"'));
    });

    it('Parses variable short notation', () => {
        const svg = generateSVG([
            path.join(__dirname, 'input/svg/variables-shorthand.svg')
        ], {
            prefix: PREFIX
        });

        const styles = generateStyles(svg, {
            prefix: PREFIX,
            extension: 'scss'
        }).content.trim();

        expect(styles).toEqual(expect.stringContaining('"stroke": "blue"'));
    });
});
