const svgo = require('svgo');
const { omit, concat, uniqBy } = require('lodash');
const { merge } = require('webpack-merge');

module.exports = (options, pre = [], post = []) => {
    try {
        // The preset-default plugin is only available since SVGO 2.4.0
        svgo.optimize('', {
            plugins: [{
                name: 'preset-default'
            }]
        });

        const names = concat(pre, post).map((plugin) => plugin.name);
        return merge({}, omit(options, ['plugins']), {
            plugins: [{
                name: 'preset-default',
                params: {
                    overrides: uniqBy(concat(pre, options.plugins, post).reverse(), 'name').reduce((overrides, plugin) => ({
                        ...overrides,
                        [plugin.name]: plugin.active !== false
                            ? plugin.params
                            : false
                    }), {})
                }
            }, ...options.plugins.filter((plugin) => {
                return !names.includes(plugin.name);
            })]
        });
    } catch (error) {
        // Fall back to extendDefaultPlugins which is deprecated since 2.4.0
        return merge({}, omit(options, ['plugins']), {
            plugins: uniqBy(concat(pre, svgo.extendDefaultPlugins(options.plugins), post).reverse(), 'name')
        });
    }
}
