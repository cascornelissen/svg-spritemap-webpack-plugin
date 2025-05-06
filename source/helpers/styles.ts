import fs from 'node:fs';
import path from 'node:path';
import xmldom from '@xmldom/xmldom';
import webpack from 'webpack';
import { mkdirp } from 'mkdirp';

// Helpers
import styleFormatters from './style-formatters/index.js';
import { SVG_PARSER } from './svg.js';

// Types
import { OptionsWithStyles, StylesType } from '../types.js';

export const generateStyles = (spritemap: string | undefined, options: OptionsWithStyles, warnings: webpack.WebpackError[], compilation: webpack.Compilation) => {
    if (!spritemap) {
        return;
    }

    const extension = path.extname(options.styles.filename).toLowerCase().slice(1);
    const formatter = styleFormatters[extension];

    if (formatter === undefined) {
        throw new Error(`Unsupported styles extension: ${extension}`);
    }

    const svg = SVG_PARSER.parseFromString(spritemap, 'image/svg+xml').documentElement ?? undefined;

    if (!svg) {
        return;
    }

    const symbols = [...svg.childNodes].filter((node): node is xmldom.Element => {
        return node.nodeName === 'symbol';
    });

    const output = formatter(symbols, options, compilation);

    writeStylesToDisk(output, options);

    return output;
};

const writeStylesToDisk = (content: string | undefined, options: OptionsWithStyles) => {
    if (!content) {
        return;
    }

    const type = getStylesType(content, options.styles.filename);

    if (!type || type === StylesType.Asset) {
        return;
    }

    const location = {
        [StylesType.Directory]: options.styles.filename,
        [StylesType.Module]: path.resolve(import.meta.dirname, '../', options.styles.filename.replace('~', ''))
    }[type];

    const exists = fs.existsSync(location);

    if (exists && fs.readFileSync(location, 'utf8') === content) {
        return;
    }

    if (type === StylesType.Directory && !exists) {
        const dirname = path.dirname(location);

        if (!fs.existsSync(dirname)) {
            mkdirp.sync(dirname);
        }
    }

    fs.writeFileSync(location, content, 'utf8');
};

export const getStylesType = (content: string, filename: string): StylesType | undefined => {
    if (!content || !filename) {
        return;
    }

    if (path.parse(filename).dir) {
        return StylesType.Directory;
    }

    if (filename.startsWith('~')) {
        return StylesType.Module;
    }

    return StylesType.Asset;
};
