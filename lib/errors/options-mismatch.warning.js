const WebpackError = require('webpack/lib/WebpackError');

module.exports = class OptionsMismatchWarning extends WebpackError {
    constructor(message) {
        super();

        this.name = 'OptionsMismatchWarning';
        this.message = [
            require('../../package.json').name,
            `The following mismatch between multiple options was detected: \n${message}`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
