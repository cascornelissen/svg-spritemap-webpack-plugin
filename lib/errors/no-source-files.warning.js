import WebpackError from 'webpack/lib/WebpackError';

export default class NoSourceFilesWarning extends WebpackError {
    constructor(pattern) {
        super();

        this.name = 'NoSourceFilesWarning';
        this.message = [
            import('../../package.json').name,
            `No source files match the patterns: '${pattern.join(', ')}'`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
