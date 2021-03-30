const { merge, mergeWithCustomize } = require('webpack-merge');
// SVGO doesn't export `resolvePluginConfig` in the default module.
const { resolvePluginConfig } = require('svgo/lib/svgo/config');

exports.merge = mergeWithCustomize({
  customizeArray(a, b, key) {
    if (key === 'plugins') {
      const plugins = a.map(plugin => resolvePluginConfig(plugin, {}));
      const newPlugins = b.map(plugin => resolvePluginConfig(plugin, {}));

      newPlugins.forEach(newPlugin => {
        const index = plugins.findIndex(originalPlugin => originalPlugin.name === newPlugin.name);
        if(index === -1) {
          plugins.push(newPlugin);
        } else {
          plugins[index] = merge(plugins[index], newPlugin);
        }
      });

      return plugins;
    }

    // Fall back to default merging
    return undefined;
  }
});
