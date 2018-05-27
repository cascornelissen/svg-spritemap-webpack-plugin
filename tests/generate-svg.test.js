import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';

const OPTIONS = {
    gutter: 2,
    prefix: 'sprite-',
    generateTitle: true
};

it('Returns undefined when no files are specified', () => {
    expect(generateSVG([])).toBeUndefined();
});

it('Transforms a single file correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/single.svg'), 'utf-8').trim();

    expect(generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ], OPTIONS)).toBe(output);
});

it('Transforms multiple files correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/multiple.svg'), 'utf-8').trim();

    expect(generateSVG([
        path.join(__dirname, 'input/svg/multiple-a.svg'),
        path.join(__dirname, 'input/svg/multiple-b.svg')
    ], OPTIONS)).toBe(output);
});

it('Transforms files with an incorrect \'viewBox\' attribute correctly', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/viewbox.svg'), 'utf-8').trim();

    expect(generateSVG([
        path.join(__dirname, 'input/svg/viewbox.svg')
    ], OPTIONS)).toBe(output);
});

it('Does not overwrite an existing title tag', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/title-tag.svg'), 'utf-8').trim();

    expect(generateSVG([
        path.join(__dirname, 'input/svg/title-tag.svg')
    ], OPTIONS)).toBe(output);
});

it('Does not generate a title element when \'options.generateTitle\' is \'false\'', () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/no-title.svg'), 'utf-8').trim();

    expect(generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ], Object.assign({}, OPTIONS, {
        generateTitle: false
    }))).toBe(output);
});

it('Throws when the width/height of an SVG can not be calculated', () => {
    expect(() => {
        generateSVG([
            path.join(__dirname, 'input/svg/invalid-svg.svg')
        ], OPTIONS);
    }).toThrow();
});
