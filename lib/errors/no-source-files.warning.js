const WebpackError = require('webpack/lib/WebpackError');

module.exports = class NoSourceFilesWarning extends WebpackError {
    constructor(pattern) {
        super();

        this.name = 'NoSourceFilesWarning';
        this.message = [
            require('../../package.json').name,
            `No source files match the patterns: '${pattern.join(', ')}'`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
