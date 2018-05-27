import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';
import generateStyles from '../lib/generate-styles';

// Variables
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
    }).content.trim()).toBe(output);
});

it('Generates SCSS styles', () => {
    const template = fs.readFileSync(path.join(__dirname, '../lib/templates/styles.scss'), 'utf-8').trim();
    const sprites = `'single': "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e %3cpath d='M21%2c7L9%2c19L3.5%2c13.5L4.91%2c12.09L9%2c16.17L19.59%2c5.59L21%2c7Z'/%3e %3c/svg%3e"`;
    const variables = '';
    const output = template.replace('/* SPRITES */', sprites).replace('/* VARIABLES */', variables);

    expect(generateStyles(SPRITEMAP, {
        prefix: PREFIX,
        extension: 'scss'
    }).content.trim()).toBe(output);
});

it('Generates LESS styles', () => {
    const template = fs.readFileSync(path.join(__dirname, '../lib/templates/styles.less'), 'utf-8').trim();
    const sprites = `@sprite-single: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3e %3cpath d='M21%2c7L9%2c19L3.5%2c13.5L4.91%2c12.09L9%2c16.17L19.59%2c5.59L21%2c7Z'/%3e %3c/svg%3e";`;
    const output = template.replace('/* SPRITES */', sprites);

    expect(generateStyles(SPRITEMAP, {
        prefix: PREFIX,
        extension: 'less'
    }).content.trim()).toBe(output);
});
