import fs from 'fs';
import path from 'path';
import SVGSpritemapPlugin from '../svg-spritemap';

it('Returns \'undefined\' when no files are specified', () => {
    const plugin = new SVGSpritemapPlugin;

    expect(plugin.generateSVG([])).toBeUndefined();
});

it('Transforms a single file correctly', () => {
    const plugin = new SVGSpritemapPlugin;
    const output = fs.readFileSync(path.join(__dirname, 'output/single.svg'), 'utf-8');

    expect(plugin.generateSVG([
        path.join(__dirname, 'input/single.svg')
    ])).toBe(output.trim());
});

it('Transforms multiple files correctly', () => {
    const plugin = new SVGSpritemapPlugin;
    const output = fs.readFileSync(path.join(__dirname, 'output/multiple.svg'), 'utf-8');

    expect(plugin.generateSVG([
        path.join(__dirname, 'input/multiple-a.svg'),
        path.join(__dirname, 'input/multiple-b.svg')
    ])).toBe(output.trim());
});

it('Does not overwrite an existing title tag', () => {
    const plugin = new SVGSpritemapPlugin;
    const output = fs.readFileSync(path.join(__dirname, 'output/title-tag.svg'), 'utf-8');

    expect(plugin.generateSVG([
        path.join(__dirname, 'input/title-tag.svg')
    ])).toBe(output.trim());
});

it('Throws an error when the width/height of an SVG can not be calculated', () => {
    const plugin = new SVGSpritemapPlugin;

    expect(() => {
        plugin.generateSVG([
            path.join(__dirname, 'input/invalid-svg.svg')
        ])
    }).toThrow();
});
