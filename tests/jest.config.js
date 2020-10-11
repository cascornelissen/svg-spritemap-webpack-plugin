const path = require('path');
const { getWebpackModuleName } = require('./jest.helpers');

require('module-alias').addAliases('webpack', path.resolve(__dirname, `../node_modules/${getWebpackModuleName()}`));

module.exports = {
    rootDir: path.resolve(__dirname, '../'),
    setupFiles: [
        path.resolve(__dirname, 'jest.setup.js')
    ],
    moduleNameMapper: {
        'webpack/(.*)': `<rootDir>/node_modules/${getWebpackModuleName()}/$1`
    }
};
