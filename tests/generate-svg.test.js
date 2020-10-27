import fs from 'fs';
import path from 'path';

// Library
import generateSVG from '../lib/generate-svg';
import SVGSpritemapPlugin from '../lib/';

// Constants
const CHUNK_NAME = 'spritemap';

it('Returns undefined when no files are specified', async () => {
    const svg = await generateSVG();

    expect(svg).toBeUndefined();
});

it('Transforms a single file correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/single.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ]);

    expect(svg).toBe(output);
});

it('Transforms multiple files correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/multiple.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/multiple-a.svg'),
        path.resolve(__dirname, 'input/svg/multiple-b.svg')
    ]);

    expect(svg).toBe(output);
});

it('Transforms files with an incorrect \'viewBox\' attribute correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/viewbox.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/viewbox.svg')
    ]);

    expect(svg).toBe(output);
});

it('Does not optimize sprites when the \'output.svgo\' option is `false`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/single-without-svgo.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        output: {
            svgo: false
        }
    });

    expect(svg).toBe(output);
});

it('Does not overwrite an existing title tag', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/title-tag.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/title-tag.svg')
    ]);

    expect(svg).toBe(output);
});

it('Does not generate a title element when \'options.generate.title\' is `false`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/without-title.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        sprite: {
            generate: {
                title: false
            }
        }
    });

    expect(svg).toBe(output);
});

it('Generates with use tag when \'options.generate.use\' is `true`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/with-use.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        output: {
            svg: {
                sizes: true
            }
        },
        sprite: {
            generate: {
                use: true
            }
        }
    });

    expect(svg).toBe(output);
});

it('Generates with view tag when \'options.generate.view\' is `true`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/with-view.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        sprite: {
            generate: {
                view: true
            }
        }
    });

    expect(svg).toBe(output);
});

it('Adds the width and height attribute to the root SVG when required', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/sizes.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        output: {
            svg: {
                sizes: true
            }
        }
    });

    expect(svg).toBe(output);
});

it('Throws when the width/height of an SVG can not be calculated', () => {
    expect(generateSVG([
        path.resolve(__dirname, 'input/svg/invalid-svg.svg')
    ])).rejects.toMatch('Invalid SVG');
});

it('Use prefix as function', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/prefixed.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/single.svg')
    ], {
        sprite: {
            prefix: () => {
                return 'ico-';
            },
            generate: {
                title: true,
                symbol: true,
                use: true,
                view: '-view'
            }
        }
    });

    expect(svg).toBe(output);
});

it('Should not transfer non-valid attributes to the root SVG', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/attributes-no-transfer-invalid-root.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/attributes-no-transfer-invalid-root.svg')
    ], {
        output: {
            svgo: false
        },
        sprite: {
            generate: {
                symbol: true,
                view: true
            }
        }
    });

    expect(svg).toBe(output);
});

it('Should transfer valid root attribute', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/attributes-transfer-valid-attributes.svg'), 'utf-8').trim();
    const svg = await generateSVG([
        path.resolve(__dirname, 'input/svg/attributes-transfer-valid-attributes.svg')
    ], {
        output: {
            svgo: false
        },
        sprite: {
            generate: {
                symbol: true,
                view: true
            }
        }
    });

    expect(svg).toBe(output);
});

it('Deletes the chunk files', (done) => {
    global.__WEBPACK__({
        entry: path.resolve(__dirname, 'webpack/index.js'),
        mode: 'development',
        devtool: 'hidden-source-map',
        plugins: [
            new SVGSpritemapPlugin(path.resolve(__dirname, 'input/svg/single.svg'), {
                output: {
                    chunk: {
                        name: CHUNK_NAME
                    }
                }
            })
        ]
    }, (err, stats) => {
        const assets = stats.toJson().assets.map((asset) => asset.name);
        expect(assets).toHaveLength(3);
        done();
    });
});

it('Deletes the chunk files when chunks are split', (done) => {
    global.__WEBPACK__({
        entry: path.resolve(__dirname, 'webpack/index.js'),
        mode: 'development',
        devtool: 'hidden-source-map',
        optimization: {
            splitChunks: {
                minSize: 1024,
                maxSize: 2048
            }
        },
        plugins: [
            new SVGSpritemapPlugin(path.resolve(__dirname, 'input/svg/single.svg'), {
                output: {
                    chunk: {
                        name: CHUNK_NAME
                    }
                }
            })
        ]
    }, (err, stats) => {
        const assets = stats.toJson().assets.map((asset) => asset.name);
        expect(assets).toHaveLength(3);
        done();
    });
});

it('Does not delete the chunk files when \'output.chunk.keep\' is \'true\'', (done) => {
    global.__WEBPACK__({
        entry: path.resolve(__dirname, 'webpack/index.js'),
        mode: 'development',
        devtool: 'hidden-source-map',
        plugins: [
            new SVGSpritemapPlugin(path.resolve(__dirname, 'input/svg/single.svg'), {
                output: {
                    chunk: {
                        keep: true,
                        name: CHUNK_NAME
                    }
                }
            })
        ]
    }, (err, stats) => {
        const assets = stats.toJson().assets.map((asset) => asset.name);
        expect(assets).toEqual(expect.arrayContaining([`${CHUNK_NAME}.js`]));
        done();
    });
});
