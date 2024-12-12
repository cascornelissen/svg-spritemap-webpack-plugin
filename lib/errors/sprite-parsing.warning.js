import WebpackError from 'webpack/lib/WebpackError.js';

export default class SpriteParsingWarning extends WebpackError {
    constructor(message) {
        super();

        this.name = 'SpriteParsingWarning';
        this.message = [
            import('../../package.json').name,
            message
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
