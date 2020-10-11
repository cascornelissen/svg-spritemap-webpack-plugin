const { getWebpackModuleName } = require('./jest.helpers');

global.__WEBPACK__ = require(getWebpackModuleName());
global.__WEBPACK_VERSION__ = global.__WEBPACK__.version;
