// Helpers
import cssFormatter from './css/index.js';
import scssFormatter from './scss/index.js';
import lessFormatter from './less/index.js';

// Types
import { StyleFormatter } from './types.js';

const formatters: Partial<Record<string, StyleFormatter>> = {
    css: cssFormatter,
    scss: scssFormatter,
    sass: scssFormatter,
    less: lessFormatter
};

export default formatters;
