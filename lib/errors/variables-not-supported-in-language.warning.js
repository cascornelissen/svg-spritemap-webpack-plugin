import WebpackError from 'webpack/lib/WebpackError.js';

export default class VariablesNotSupportedInLanguageWarning extends WebpackError {
    constructor(language) {
        super();

        this.name = 'VariablesNotSupportedInLanguageWarning';
        this.message = [
            import('../../package.json').name,
            `Variables are not supported when using ${language.toUpperCase()}`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
