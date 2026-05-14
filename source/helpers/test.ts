import assert from 'node:assert';
import { describe, it } from 'node:test';

// Helpers
import { getStylesType } from './styles.js';
import { addVariablesNamespace, findDefaultVariableValueMismatches, findVariables, hasVariables, stripVariables } from './variables.js';

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

describe('hasVariables()', () => {
    [{
        content: '<svg><path var:fill="red"/></svg>',
        expected: true
    }, {
        content: '<svg><path fill="red"/></svg>',
        expected: false
    }, {
        content: ['<svg/>', '<path var:fill="red"/>'],
        expected: true
    }, {
        content: undefined,
        expected: false
    }].forEach(({ content, expected }) => {
        it(`returns ${expected} when content equals ${JSON.stringify(content)}`, () => {
            assert.strictEqual(hasVariables(content), expected);
        });
    });
});

describe('findVariables()', () => {
    [{
        content: '<path var:fill="red"/>',
        expected: [{
            name: 'fill',
            attribute: 'fill',
            value: 'red'
        }]
    }, {
        content: '<path var:color.fill="red"/>',
        expected: [{
            name: 'color',
            attribute: 'fill',
            value: 'red'
        }]
    }, {
        content: '<svg/>',
        expected: []
    }].forEach(({ content, expected }) => {
        it(`returns ${JSON.stringify(expected)} when content equals ${JSON.stringify(content)}`, () => {
            assert.deepStrictEqual(findVariables(content), expected);
        });
    });
});

describe('addVariablesNamespace()', () => {
    it('adds xmlns:var when missing', () => {
        const result = addVariablesNamespace('<svg viewBox="0 0 1 1"><path var:fill="red"/></svg>');

        assert.match(result, /<svg xmlns:var="[^"]+" viewBox/);
    });

    it('leaves content unchanged when xmlns:var is already present', () => {
        const content = '<svg xmlns:var="https://example.com/" viewBox="0 0 1 1"/>';

        assert.strictEqual(addVariablesNamespace(content), content);
    });

    it('does not duplicate the namespace across successive calls', () => {
        const long = '<svg xmlns:var="https://github.com/cascornelissen/svg-spritemap-webpack-plugin/" viewBox="0 0 24 24"><path var:fill="red" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 19,3"/></svg>';
        const short = '<svg xmlns:var="x"/>';

        assert.strictEqual(addVariablesNamespace(long), long);
        assert.strictEqual(addVariablesNamespace(short), short);
        assert.strictEqual((addVariablesNamespace(short).match(/xmlns:var=/g) ?? []).length, 1);
    });
});

describe('findDefaultVariableValueMismatches()', () => {
    [{
        content: '<svg/>',
        expected: []
    }, {
        content: '<svg><path var:fill="red"/><circle var:fill="red"/></svg>',
        expected: []
    }, {
        content: '<svg><path var:fill="red"/><circle var:fill="blue"/></svg>',
        expected: [{
            name: 'fill',
            values: ['red', 'blue']
        }]
    }, {
        content: '<svg><path var:fill="red"/><circle var:fill="blue"/><rect var:stroke="x"/></svg>',
        expected: [{
            name: 'fill',
            values: ['red', 'blue']
        }]
    }].forEach(({ content, expected }) => {
        it(`returns ${JSON.stringify(expected)} when content equals ${JSON.stringify(content)}`, () => {
            assert.deepStrictEqual(findDefaultVariableValueMismatches(content), expected);
        });
    });
});

describe('stripVariables()', () => {
    it('converts var:foo="x" to foo="x"', () => {
        const result = stripVariables('<path var:fill="red"/>');

        assert.match(result, /fill="red"/);
        assert.doesNotMatch(result, /var:fill/);
    });

    it('removes the xmlns:var namespace declaration', () => {
        const result = stripVariables('<svg xmlns:var="https://example.com/" viewBox="0 0 1 1"/>');

        assert.doesNotMatch(result, /xmlns:var=/);
    });
});
