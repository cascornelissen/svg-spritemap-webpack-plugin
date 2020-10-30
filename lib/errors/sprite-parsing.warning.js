const WebpackError = require('webpack/lib/WebpackError');

module.exports = class SpriteParsingWarning extends WebpackError {
    constructor(message) {
        super();

        this.name = 'SpriteParsingWarning';
        this.message = [
            require('../../package.json').name,
            message
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
