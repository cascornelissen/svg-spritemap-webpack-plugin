import fs from 'node:fs';
import path from 'node:path';
import webpack from 'webpack';
import loaderUtils from 'loader-utils';
import { glob } from 'glob';
import { PartialDeep } from 'type-fest';
import { intersection, uniq, escapeRegExp } from 'lodash-es';

// Helpers
import { getTemplate } from './helpers/template.js';
import { hasVariables } from './helpers/variables.js';
import { applyEntryPlugin } from './helpers/entry.js';
import { generateSVG, optimizeSVG } from './helpers/svg.js';
import { generateStyles, getStylesType } from './helpers/styles.js';
import { formatOptions, isOptionsWithStyles } from './helpers/options.js';

// Constants
import { PLUGIN } from './constants.js';

// Types
import { Output, Options, Patterns, StylesType, Source } from './types.js';

class SVGSpritemapPlugin {
    patterns: Patterns;
    options: Options;
    warnings: webpack.WebpackError[] = [];

    filenames: Record<Output, string | undefined> = {
        spritemap: undefined,
        styles: undefined
    };

    output: Record<Output, string | undefined> = {
        spritemap: undefined,
        styles: undefined
    };

    cache: Record<Output, string | undefined> = {
        spritemap: undefined,
        styles: undefined
    };

    dependencies: Record<string, string[]> = {
        files: [],
        directories: []
    };

    constructor(patterns: Patterns | Patterns[number] = '**/*.svg', options: PartialDeep<Options> = {}) {
        this.patterns = Array.isArray(patterns) ? patterns : [patterns];
        this.options = formatOptions(options);

        this.updateFilenames();
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.entryOption.tap(PLUGIN, this.injectEntry.bind(this, compiler));
        compiler.hooks.environment.tap(PLUGIN, this.updateDependencies);
        compiler.hooks.run.tapPromise(PLUGIN, this.generateSpritemap);
        compiler.hooks.watchRun.tap(PLUGIN, this.updateDependencies);
        compiler.hooks.watchRun.tapPromise(PLUGIN, this.generateSpritemap);
        compiler.hooks.make.tap(PLUGIN, this.make);
        compiler.hooks.thisCompilation.tap(PLUGIN, this.cleanup);
        compiler.hooks.afterCompile.tap(PLUGIN, this.updateWarnings);
        compiler.hooks.afterCompile.tap(PLUGIN, this.updateContextDependencies);
    };

    private make = (compilation: webpack.Compilation) => {
        this.updateFilenames();

        if (this.output.spritemap) {
            compilation.emitAsset(this.options.output.filename, new webpack.sources.RawSource(this.output.spritemap), {
                immutable: this.cache.spritemap === this.output.spritemap,
                development: false,
                javascriptModule: false
            });

            this.cache.spritemap = this.output.spritemap;
            this.updateFilename(Output.Spritemap, compilation);
            this.generateStyles(compilation);
        }

        compilation.hooks.afterHash.tap(PLUGIN, () => {
            this.updateFilename(Output.Spritemap, compilation);

            if (isOptionsWithStyles(this.options) && this.output.styles !== undefined && getStylesType(this.output.styles, this.options.styles.filename) === StylesType.Asset) {
                compilation.emitAsset(this.options.styles.filename, new webpack.sources.RawSource(this.output.styles));
            }
        });

        compilation.hooks.processAssets.tap({
            name: this.constructor.name,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        }, () => {
            if (!this.filenames.spritemap) {
                return;
            }

            const source = compilation.getAsset(this.filenames.spritemap)?.source.source().toString();

            if (!source) {
                return;
            }

            compilation.updateAsset(this.filenames.spritemap, new webpack.sources.RawSource(optimizeSVG(source, this.options)), {
                minimized: !!this.options.output.svgo
            });

            compilation.chunks.forEach((chunk) => {
                if (!this.filenames.spritemap || chunk.name !== this.options.output.chunk.name) {
                    return;
                }

                chunk.files.add(this.filenames.spritemap);
            });
        });
    };

    private generateSpritemap = async (compiler: webpack.Compiler) => {
        const sprites = Object.values(this.dependencies).flat();
        const modifiedFiles = compiler.modifiedFiles ? [...compiler.modifiedFiles] : [];

        if (modifiedFiles.length && !intersection(sprites, modifiedFiles).length) {
            return;
        }

        const sources: Source[] = await Promise.all(this.dependencies.files.map(async (location) => {
            return {
                location,
                content: await fs.promises.readFile(location, 'utf8')
            };
        }));

        if (!sources.length) {
            this.warnings.push(new webpack.WebpackError(`No SVG files found in the specified patterns: ${this.patterns.join(', ')}`));
        }

        if (this.options.sprite.generate.view && !this.options.sprite.generate.use) {
            this.warnings.push(new webpack.WebpackError(`Using sprite.generate.view requires sprite.generate.use to be enabled`));
        }

        if (this.options.sprite.generate.use && !this.options.sprite.generate.symbol) {
            this.warnings.push(new webpack.WebpackError(`Using sprite.generate.use requires sprite.generate.symbol to be enabled`));
        }

        if (this.options.sprite.generate.title && !this.options.sprite.generate.symbol) {
            this.warnings.push(new webpack.WebpackError(`Using sprite.generate.title requires sprite.generate.symbol to be enabled`));
        }

        if (this.options.sprite.generate.symbol === true && this.options.sprite.generate.view === true) {
            this.warnings.push(new webpack.WebpackError('Both sprite.generate.symbol and sprite.generate.view are set to true which will cause identifier conflicts, use a string value (postfix) for either of these options'));
        }

        this.output.spritemap = generateSVG(sources, this.options, this.warnings);
    };

    private generateStyles = (compilation: webpack.Compilation) => {
        if (!isOptionsWithStyles(this.options)) {
            return;
        }

        const extension = path.extname(this.options.styles.filename).slice(1).toLowerCase();

        if (!['scss', 'sass'].includes(extension) && hasVariables(this.output.spritemap)) {
            this.warnings.push(new webpack.WebpackError(`Variables are not supported when using ${extension.toUpperCase()}`));
        }

        if (this.options.styles.format === 'fragment' && hasVariables(this.output.spritemap)) {
            this.warnings.push(new webpack.WebpackError(`Variables will not work when using styles.format set to 'fragment'`));
        }

        // Emit a warning when using 'fragment' for styles.format without enabling sprite.generate.view
        if (this.options.styles.format === 'fragment' && !this.options.sprite.generate.view) {
            this.warnings.push(new webpack.WebpackError(`Using styles.format with value 'fragment' in combination with sprite.generate.view with value false will result in CSS fragments not working correctly`));
        }

        // Emit a warning when using [hash] in filename while using 'fragment' for styles.format
        if (this.options.styles.format === 'fragment' && this.options.output.filename.includes('[hash]')) {
            this.warnings.push(new webpack.WebpackError(`Using styles.format with value 'fragment' in combination with [hash] in output.filename will result in incorrect fragment URLs`));
        }

        this.output.styles = generateStyles(this.output.spritemap, this.options, this.warnings, compilation);
    };

    private injectEntry = (compiler: webpack.Compiler, context: string, entry: webpack.EntryNormalized) => {
        if (!this.options.output.svg4everybody) {
            return;
        }

        const template = getTemplate('svg4everybody.js');
        const output = path.resolve(import.meta.dirname, 'svg4everybody-helper.js');

        fs.writeFileSync(output, template.replace('/* PLACEHOLDER */', JSON.stringify(this.options.output.svg4everybody)), 'utf8');

        if (typeof entry === 'object') {
            Object.keys(entry).forEach((name) => {
                const subentry = entry[name];

                if ('import' in subentry && subentry.import) {
                    applyEntryPlugin(compiler, context, [...subentry.import, output], name);
                } else {
                    throw new TypeError(`Unsupported sub-entry type for svg4everybody helper: '${typeof subentry}'`);
                }
            });
        } else {
            throw new TypeError(`Unsupported entry type for svg4everybody helper: '${typeof entry}'`);
        }
    };

    private updateDependencies = () => {
        this.dependencies.files = [];
        this.dependencies.directories = [];

        this.patterns.forEach((pattern) => {
            const root = path.resolve(pattern.replace(/\*.*/, ''));

            if (!path.basename(root).includes('.')) {
                this.dependencies.directories.push(root);
            }

            glob.sync(pattern, this.options.input.options).map((match) => {
                const pathname = path.resolve(match);
                const stats = fs.lstatSync(pathname);

                if (stats.isFile()) {
                    this.dependencies.files.push(pathname);
                    this.dependencies.directories.push(path.dirname(pathname));
                } else if (stats.isDirectory()) {
                    this.dependencies.directories.push(pathname);
                }
            });
        });

        if (!this.options.input.allowDuplicates) {
            this.dependencies.files = uniq(this.dependencies.files);
            this.dependencies.directories = uniq(this.dependencies.directories);
        }

        this.dependencies.files.sort();
        this.dependencies.directories.sort();
    };

    private updateContextDependencies = (compilation: webpack.Compilation) => {
        this.dependencies.directories.forEach((directory) => {
            compilation.contextDependencies.add(directory);
        });
    };

    private updateWarnings = (compilation: webpack.Compilation) => {
        compilation.warnings = [...compilation.warnings, ...this.warnings];
    };

    private updateFilenames = () => {
        this.filenames.spritemap = this.options.output.filename;

        if (isOptionsWithStyles(this.options)) {
            this.filenames.styles = this.options.styles.filename;
        }
    };

    private updateFilename = (name: Output, compilation: webpack.Compilation) => {
        const oldFilename = this.filenames[name];

        if (!oldFilename) {
            return oldFilename;
        }

        const asset = compilation.getAsset(oldFilename);

        if (!asset) {
            return oldFilename;
        }

        const contenthash = loaderUtils.getHashDigest(asset.source.buffer(), 'sha1', 'hex', compilation.options.output.hashDigestLength);
        const newFilename = Object.entries({
            '[hash]': compilation.hash,
            '[contenthash]': contenthash
        }).reduce((filename, [pattern, value]) => {
            return filename.replaceAll(new RegExp(escapeRegExp(pattern), 'ig'), value ?? pattern);
        }, oldFilename);

        compilation.renameAsset(oldFilename, newFilename);
        compilation.updateAsset(newFilename, asset.source, {
            contenthash: contenthash
        });

        this.filenames[name] = newFilename;
    };

    private cleanup = (compilation: webpack.Compilation) => {
        if (this.options.output.chunk.keep) {
            return;
        }

        compilation.hooks.processAssets.tap({
            name: this.constructor.name,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        }, () => {
            const filenames = compilation.options.plugins.filter((plugin) => {
                return plugin instanceof SVGSpritemapPlugin;
            }).map((plugin) => {
                return Object.values(plugin.filenames);
            }).reduce((filenames, values) => {
                return [...filenames, ...values];
            }, []);

            [...compilation.chunks].filter((chunk) => {
                if (!chunk.name) {
                    return false;
                }

                return chunk.name.startsWith(this.options.output.chunk.name);
            }).forEach((chunk) => {
                [...chunk.files].filter((file) => {
                    return !filenames.includes(file);
                }).forEach((file) => {
                    delete compilation.assets[file]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                });
            });
        });
    };
}

export default SVGSpritemapPlugin;
