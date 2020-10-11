const { getWebpackModuleName } = require('./jest.helpers');

global.__WEBPACK__ = require(getWebpackModuleName());
