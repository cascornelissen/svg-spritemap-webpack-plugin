import configure, { configs } from '@onefinity/eslint-config';

export default configure([configs.node, {
    rules: {
        'unicorn/prefer-dom-node-append': 'off',
        'unicorn/prefer-dom-node-dataset': 'off'
    }
}, {
    files: ['examples/**/*'],
    rules: {
        '@onefinity/eslint-config/import-grouping': 'off'
    }
}]);
