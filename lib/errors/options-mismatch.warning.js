import WebpackError from 'webpack/lib/WebpackError.js';

export default class OptionsMismatchWarning extends WebpackError {
    constructor(message) {
        super();

        this.name = 'OptionsMismatchWarning';
        this.message = [
            import('../../package.json').name,
            `The following mismatch between multiple options was detected: \n${message}`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
