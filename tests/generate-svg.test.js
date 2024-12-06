import fs from 'node:fs';
import path from 'node:path';
import webpack from 'webpack';

// Library
import generateSVG from '../lib/generate-svg';
import formatOptions from '../lib/options-formatter';
import SVGSpritemapPlugin from '../lib/';

// Constants
const CHUNK_NAME = 'spritemap';
const DEFAULT_OPTIONS = formatOptions();
const __dirname = new URL(import.meta.url + '/..').pathname;

it('Returns undefined when no files are specified', async () => {
    const svg = await generateSVG(undefined, DEFAULT_OPTIONS);

    expect(svg).toBeUndefined();
});

it('Transforms a single file correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/single.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], DEFAULT_OPTIONS);

    expect(svg).toEqual(output);
});

it('Transforms multiple files correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/multiple.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/multiple-a.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/multiple-a.svg'), 'utf-8')
    }, {
        path: path.resolve(__dirname, 'input/svg/multiple-b.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/multiple-b.svg'), 'utf-8')
    }], DEFAULT_OPTIONS);

    expect(svg).toEqual(output);
});

it('Transforms files with an incorrect \'viewBox\' attribute correctly', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/viewbox.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/viewbox.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/viewbox.svg'), 'utf-8')
    }], DEFAULT_OPTIONS);

    expect(svg).toEqual(output);
});

it('Does not optimize sprites when the \'output.svgo\' option is `false`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/without-svgo.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/without-svgo.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/without-svgo.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svgo: false
        }
    }));

    expect(svg).toEqual(output);
});

it('Can selectively disable SVGO plugins', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/custom-svgo.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/without-svgo.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/without-svgo.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svgo: {
                plugins: [{
                    name: 'removeDesc',
                    active: false
                }]
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Does not overwrite an existing title tag', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/title-tag.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/title-tag.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/title-tag.svg'), 'utf-8')
    }], DEFAULT_OPTIONS);

    expect(svg).toEqual(output);
});

it('Does not generate a title element when \'options.generate.title\' is `false`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/without-title.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
        sprite: {
            generate: {
                title: false
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Generates with use tag when \'options.generate.use\' is `true`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/with-use.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
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
    }));

    expect(svg).toEqual(output);
});

it('Generates with view tag when \'options.generate.view\' is `true`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/with-view.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
        sprite: {
            generate: {
                view: true
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Keeps height and width attribute when \'sprite.generate.keepDimension\' option is `true`', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/keep-dimensions.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/keep-dimensions.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/keep-dimensions.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svgo: false
        },
        sprite: {
            generate: {
                dimensions: true
            },
        }
    }));

    expect(svg).toEqual(output);
});

it('Adds the width and height attribute to the root SVG when required', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/sizes.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svg: {
                sizes: true
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Adds custom attributes to the root SVG when specified', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/custom-attributes.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svg: {
                attributes: {
                    class: 'test-custom-class',
                    id: 'test-custom-id',
                    'data-test': 'test-custom-data-attr',
                    hidden: true
                }
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Use prefix as function', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/prefixed.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/single.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/single.svg'), 'utf-8')
    }], formatOptions({
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
    }));

    expect(svg).toEqual(output);
});

it('Should not transfer non-valid attributes to the root SVG', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/attributes-no-transfer-invalid-root.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/attributes-no-transfer-invalid-root.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/attributes-no-transfer-invalid-root.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svgo: false
        },
        sprite: {
            generate: {
                symbol: true,
                view: true
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Should transfer valid root attribute', async () => {
    const output = fs.readFileSync(path.resolve(__dirname, 'output/svg/attributes-transfer-valid-attributes.svg'), 'utf-8').trim();
    const svg = await generateSVG([{
        path: path.resolve(__dirname, 'input/svg/attributes-transfer-valid-attributes.svg'),
        content: fs.readFileSync(path.resolve(__dirname, 'input/svg/attributes-transfer-valid-attributes.svg'), 'utf-8')
    }], formatOptions({
        output: {
            svgo: false
        },
        sprite: {
            generate: {
                symbol: true,
                view: true
            }
        }
    }));

    expect(svg).toEqual(output);
});

it('Deletes the chunk files', (done) => {
    webpack({
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
        const assets = stats.toJson().assets.map((asset) => {
            return asset.name;
        }).filter((name) => {
            // Webpack 4 includes .map files in assets array while > 5 does not
            return !name.endsWith('.map');
        });
        expect(assets).toHaveLength(2);
        done();
    });
});

it('Deletes the chunk files when chunks are split', (done) => {
    webpack({
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
        const assets = stats.toJson().assets.map((asset) => {
            return asset.name;
        }).filter((name) => {
            // Webpack 4 includes .map files in assets array while > 5 does not
            return !name.endsWith('.map');
        });
        expect(assets).toHaveLength(2);
        done();
    });
});

it('Does not delete the chunk files when \'output.chunk.keep\' is \'true\'', (done) => {
    webpack({
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

it('Should allow to use the same input SVG when \'input.allowDuplicates\' is \'true\'', (done) => {
    webpack({
        entry: path.resolve(__dirname, 'webpack/index.js'),
        mode: 'development',
        devtool: false,
        plugins: [
            new SVGSpritemapPlugin([
                path.resolve(__dirname, 'input/svg/single.svg'),
                path.resolve(__dirname, 'input/svg/single.svg'),
                path.resolve(__dirname, 'input/svg/single.svg')
            ], {
                input: {
                    allowDuplicates: true
                }
            })
        ]
    }, (err, stats) => {
        expect(stats.compilation.assets['spritemap.svg']).not.toBeUndefined();
        done();
    });
});

it('Should include spritemap inside generated chunk', (done) => {
    webpack({
        entry: path.resolve(__dirname, './webpack/index.js'),
        plugins: [
            new SVGSpritemapPlugin(path.resolve(__dirname, 'input/svg/single.svg'), {
                output: {
                    filename: 'spritemap.svg',
                    chunk: {
                        name: 'icons',
                    },
                },
                sprite: {
                    prefix: false
                }
            })
        ]
    }, (error, stats) => {
        const chunk = stats.compilation.namedChunks.get('icons');

        expect(chunk.files.has('icons.js')).toBeTruthy();
        expect(chunk.files.has('spritemap.svg')).toBeTruthy();
        done();
    });
});
