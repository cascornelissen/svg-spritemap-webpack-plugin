const WebpackError = require('webpack/lib/WebpackError');

module.exports = class VariablesWithInvalidDefaultsWarning extends WebpackError {
    constructor(sprite, name, values) {
        super();

        this.name = 'VariablesWithInvalidDefaultsWarning';
        this.message = [
            require('../../package.json').name,
            `Mismatching default values ('${values.join('\', \'')}') for variable '${name}' in sprite '${sprite}', '${values[0]}' will be used`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
