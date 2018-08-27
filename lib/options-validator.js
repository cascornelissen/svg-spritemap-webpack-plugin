const Joi = require('joi');
const get = require('get-value');

module.exports = (input = {}) => {
    // Make sure the SVGO cleanupIDs plugin is not being overwritten
    // and show a helpful message when a user tries anyway
    if ( [].concat(...get(input, 'svgo.plugins', { default: [] }).map((plugins) => Object.keys(plugins))).includes('cleanupIDs') ) {
        throw new Error('The SVGO cleanupIDs plugin can not be overwritten as the id attributes are required for spritemaps');
    }

    const schema = Joi.alternatives([
        Joi.string(),
        Joi.array().items(Joi.string()),
        Joi.object({
            input: Joi.object({
                pattern: Joi.alternatives([
                    Joi.string(),
                    Joi.array().items(Joi.string())
                ]),
                options: Joi.object()
            }),
            output: Joi.object({
                filename: Joi.string(),
                chunk: Joi.object({
                    name: Joi.string(),
                    keep: Joi.boolean()
                }),
                svg4everybody: Joi.alternatives([
                    Joi.boolean(),
                    Joi.object()
                ]),
                svgo: Joi.alternatives([
                    Joi.boolean(),
                    Joi.object()
                ])
            }),
            sprite: Joi.object({
                prefix: Joi.alternatives([
                    Joi.string(),
                    Joi.valid(false)
                ]),
                gutter: Joi.alternatives([
                    Joi.number(),
                    Joi.valid(false)
                ]),
                generate: Joi.object({
                    title: Joi.boolean(),
                    use: Joi.boolean(),
                    view: Joi.boolean()
                })
            }),
            styles: Joi.object({
                filename: Joi.string(),
                format: Joi.string().valid('data', 'fragment'),
                variables: Joi.object({
                    sprites: Joi.string(),
                    variables: Joi.string()
                })
            })
        })
    ]);

    const validator = Joi.validate(input, schema, {
        abortEarly: false
    });

    if ( validator.error ) {
        throw Error(validator.error);
    }
};
