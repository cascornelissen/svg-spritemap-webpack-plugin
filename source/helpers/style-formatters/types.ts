import type webpack from 'webpack';
import type xmldom from '@xmldom/xmldom';

// Types
import { type OptionsWithStyles } from '../../types.js';

export type StyleFormatter = (symbols: xmldom.Element[], options: OptionsWithStyles, compilation: webpack.Compilation) => string;
