import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';

const PREFIX = 'sprite-';
const SPRITEMAP = generateSVG([
    path.join(__dirname, 'input/svg/single.svg')
], {
    prefix: PREFIX
});

it('Returns undefined when no spritemap is provided', () => {
    expect(generateStyles()).toBeUndefined();
});

it('Throws when an unsupported styles extension is provided', () => {
    expect(() => {
        generateStyles(SPRITEMAP, {
            extension: 'a'
        })
    }).toThrow();
});

it('Generates CSS styles', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/styles/sprites.css'), 'utf-8').trim();

    expect(generateStyles(SPRITEMAP, {
        prefix: PREFIX,
        extension: 'css'
    })).toBe(output);
});

it('Generates SCSS styles', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/styles/sprites.scss'), 'utf-8').trim();

    expect(generateStyles(SPRITEMAP, {
        prefix: PREFIX,
        extension: 'scss'
    }).trim()).toBe(output);
});

it('Generates LESS styles', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/styles/sprites.less'), 'utf-8').trim();

    expect(generateStyles(SPRITEMAP, {
        prefix: PREFIX,
        extension: 'less'
    }).trim()).toBe(output);
});
