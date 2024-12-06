import WebpackError from 'webpack/lib/WebpackError';

export default class VariablesNotSupportedWithFragmentsWarning extends WebpackError {
    constructor() {
        super();

        this.name = 'VariablesNotSupportedWithFragmentsWarning';
        this.message = [
            import('../../package.json').name,
            `Variables will not work when using styles.format 'fragments'`
        ].join('\n');

        Error.captureStackTrace(this, this.constructor);
    }
};
