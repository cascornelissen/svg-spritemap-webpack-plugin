module.exports = {
    getWebpackModuleName() {
        return typeof process.env.WEBPACK_VERSION === 'undefined' ? 'webpack' : `webpack-v${process.env.WEBPACK_VERSION}`;
    }
};
