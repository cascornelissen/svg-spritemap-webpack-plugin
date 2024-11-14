const Joi = require('joi');

module.exports = (pattern, options = {}) => {
    const schemas = [{
        input: pattern,
        schema: Joi.alternatives([
            Joi.string(),
            Joi.array().items(Joi.string())
        ]),
    }, {
        input: options,
        schema: Joi.object({
            input: Joi.object({
                options: Joi.object(),
                allowDuplicates: Joi.boolean()
            }),
            output: Joi.object({
                filename: Joi.string(),
                svg: Joi.object({
                    sizes: Joi.boolean(),
                    attributes: Joi.object()
                }),
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
                    Joi.string().allow(''),
                    Joi.valid(false),
                    Joi.func()
                ]),
                prefixStylesSelectors: Joi.boolean(),
                idify: Joi.alternatives([
                    Joi.func(),
                    Joi.valid(false)
                ]),
                gutter: Joi.alternatives([
                    Joi.number(),
                    Joi.valid(false)
                ]),
                generate: Joi.object({
                    title: Joi.boolean(),
                    symbol: Joi.alternatives([
                        Joi.boolean(),
                        Joi.string()
                    ]),
                    use: Joi.boolean(),
                    view: Joi.alternatives([
                        Joi.boolean(),
                        Joi.string()
                    ]),
                    dimensions: Joi.boolean(),
                })
            }),
            styles: Joi.alternatives([
                Joi.boolean(),
                Joi.string(),
                Joi.object({
                    filename: Joi.string(),
                    format: Joi.string().valid('data', 'fragment'),
                    keepAttributes: Joi.boolean(),
                    variables: Joi.object({
                        sprites: Joi.string(),
                        sizes: Joi.string(),
                        variables: Joi.string(),
                        mixin: Joi.string()
                    }),
                    callback: Joi.func()
                })
            ])
        })
    }];

    schemas.forEach((schema) => {
        const validator = schema.schema.validate(schema.input, {
            abortEarly: false
        });

        if ( validator.error ) {
            throw Error(validator.error);
        }
    });
};
