import path from 'node:path';
import assert from 'node:assert';
import webpack from 'webpack';
import { rimraf } from 'rimraf';
import { describe, it, afterEach } from 'node:test';
import SVGSpritemapPlugin from './index.js'; // eslint-disable-line @onefinity/eslint-config/import-grouping

afterEach(() => {
    rimraf.sync(path.resolve(import.meta.dirname, '../dist/'));
});

describe('Options', () => {
    const options: Partial<webpack.Configuration> = {
        entry: 'data:text/javascript,',
        mode: 'development'
    };

    it('does not generate spritemap when no sprites are found', (context, done) => {
        webpack({
            ...options,
            plugins: [
                new SVGSpritemapPlugin('no-matches/**/*.svg')
            ]
        }, (errors, stats) => {
            assert.strictEqual(errors, null);
            assert.strictEqual(stats?.compilation.emittedAssets.size, 1);

            done();
        });
    });

    it('generates spritemap when sprites are found', (context, done) => {
        webpack({
            ...options,
            plugins: [
                new SVGSpritemapPlugin([
                    'tests/input/svg/single.svg',
                    'tests/input/svg/title-tag.svg'
                ])
            ]
        }, (errors, stats) => {
            assert.strictEqual(errors, null);
            assert.ok(stats?.compilation.emittedAssets.has('spritemap.svg'));

            done();
        });
    });

    it('generates styles when enabled', (context, done) => {
        webpack({
            ...options,
            plugins: [
                new SVGSpritemapPlugin('tests/input/svg/single.svg', {
                    styles: {
                        filename: 'sprite.scss'
                    }
                })
            ]
        }, (errors, stats) => {
            assert.ok(stats?.compilation.emittedAssets.has('sprite.scss'));
            assert.strictEqual(errors, null);

            rimraf.sync(path.resolve(import.meta.dirname, 'sprite.scss'));
            done();
        });
    });

    it('throws on invalid options', () => {
        assert.throws(() => {
            webpack({
                ...options,
                plugins: [
                    new SVGSpritemapPlugin('tests/input/svg/single.svg', {
                        output: {
                            // @ts-expect-error - Invalid options
                            filename: 123
                        }
                    })
                ]
            });
        });
    });

    it('adds the svg4everybody helper to each entry', (context, done) => {
        webpack({
            ...options,
            entry: {
                a: 'data:text/javascript,',
                b: 'data:text/javascript,'
            },
            plugins: [
                new SVGSpritemapPlugin('tests/input/svg/single.svg', {
                    output: {
                        svg4everybody: true
                    }
                })
            ]
        }, (errors, stats) => {
            assert.strictEqual(errors, null);
            stats?.compilation.entries.forEach((entry) => {
                assert.match(entry.dependencies.at(1)?.getResourceIdentifier() ?? '', /svg4everybody-helper.js$/);
            });

            rimraf.sync(path.resolve(import.meta.dirname, 'svg4everybody-helper.js'));
            done();
        });
    });
});
