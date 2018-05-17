const WebpackError = require('webpack/lib/WebpackError');

module.exports = class VariablesNotSupportedInLanguageWarning extends WebpackError {
    constructor(language) {
        super();

        this.name = 'VariablesNotSupportedInLanguageWarning';
        this.message = [
            require('../../package.json').name,
            `Variables are not supported when using ${language.toUpperCase()}`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
