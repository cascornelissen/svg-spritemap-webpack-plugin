import assert from 'node:assert';
import { describe, it } from 'node:test';

// Helpers
import { getStylesType } from './styles.js';

// Types
import { StylesType } from '../types.js';

describe('getStylesType()', () => {
    [{
        filename: '',
        expected: undefined
    }, {
        filename: 'sprites.css',
        expected: StylesType.Asset
    }, {
        filename: '/path/to/sprites.css',
        expected: StylesType.Directory
    }, {
        filename: '~/path/to/sprites.css',
        expected: StylesType.Directory
    }, {
        filename: '~sprites.css',
        expected: StylesType.Module
    }].forEach(({ filename, expected }) => {
        it(`returns ${expected} for filename ${filename}`, () => {
            assert.strictEqual(getStylesType(' ', filename), expected);
        });
    });
});
