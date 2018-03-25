import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';

it('Returns undefined when no files are specified', () => {
    expect(generateSVG([])).toBeUndefined();
});

it('Transforms a single file correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/single.svg'), 'utf-8');

    expect(generateSVG([
        path.join(__dirname, 'input/single.svg')
    ], {
        gutter: 2,
        prefix: 'sprite-'
    })).toBe(output.trim());
});

it('Transforms multiple files correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/multiple.svg'), 'utf-8');

    expect(generateSVG([
        path.join(__dirname, 'input/multiple-a.svg'),
        path.join(__dirname, 'input/multiple-b.svg')
    ], {
        gutter: 2,
        prefix: 'sprite-'
    })).toBe(output.trim());
});

it('Transforms files with an incorrect \'viewBox\' attribute correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/viewbox.svg'), 'utf-8');

    expect(generateSVG([
        path.join(__dirname, 'input/viewbox.svg')
    ], {
        gutter: 2,
        prefix: 'sprite-'
    })).toBe(output.trim());
});

it('Does not overwrite an existing title tag', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/title-tag.svg'), 'utf-8');

    expect(generateSVG([
        path.join(__dirname, 'input/title-tag.svg')
    ], {
        gutter: 2,
        prefix: 'sprite-'
    })).toBe(output.trim());
});

it('Throws when the width/height of an SVG can not be calculated', () => {
    expect(() => {
        generateSVG([
            path.join(__dirname, 'input/invalid-svg.svg')
        ], {
            gutter: 2,
            prefix: 'sprite-'
        });
    }).toThrow();
});
