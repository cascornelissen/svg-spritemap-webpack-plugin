const WebpackError = require('webpack/lib/WebpackError');

module.exports = class VariablesNotSupportedWithFragmentsWarning extends WebpackError {
    constructor() {
        super();

        this.name = 'VariablesNotSupportedWithFragmentsWarning';
        this.message = [
            require('../../package.json').name,
            `Variables will not work when using styles.format 'fragments'`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
