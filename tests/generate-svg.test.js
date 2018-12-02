import fs from 'fs';
import path from 'path';
import generateSVG from '../lib/generate-svg';

it('Returns undefined when no files are specified', async () => {
    const svg = await generateSVG([]);

    expect(svg).toBeUndefined();
});

it('Transforms a single file correctly', async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/single.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ]);

    expect(svg).toBe(output);
});

it('Transforms multiple files correctly', async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/multiple.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/multiple-a.svg'),
        path.join(__dirname, 'input/svg/multiple-b.svg')
    ]);

    expect(svg).toBe(output);
});

it(`Transforms files with an incorrect 'viewBox' attribute correctly`, async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/viewbox.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/viewbox.svg')
    ]);

    expect(svg).toBe(output);
});

it('Does not overwrite an existing <title> tag', async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/title-tag.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/title-tag.svg')
    ]);

    expect(svg).toBe(output);
});

it(`Does not generate a <title> element when 'options.generate.title' is 'false'`, async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/without-title.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ], {
        generate: {
            title: false
        }
    });

    expect(svg).toBe(output);
});

it(`Generates with <use> tag when 'options.generate.use' is 'true'`, async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/with-use.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ], {
        generate: {
            use: true
        }
    });

    expect(svg).toBe(output);
});

it(`Generates with <view> tag when 'options.generate.view' is 'true'`, async () => {
    const output = fs.readFileSync(path.join(__dirname, 'output/svg/with-view.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.join(__dirname, 'input/svg/single.svg')
    ], {
        generate: {
            view: true
        }
    });

    expect(svg).toBe(output);
});

it('Throws when the width/height of an SVG can not be calculated', () => {
    expect(generateSVG([
        path.join(__dirname, 'input/svg/invalid-svg.svg')
    ])).rejects.toMatch('Invalid SVG');
});
