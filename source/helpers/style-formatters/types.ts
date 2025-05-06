import webpack from 'webpack';
import xmldom from '@xmldom/xmldom';

// Types
import { OptionsWithStyles } from '../../types.js';

export type StyleFormatter = (symbols: xmldom.Element[], options: OptionsWithStyles, compilation: webpack.Compilation) => string;
