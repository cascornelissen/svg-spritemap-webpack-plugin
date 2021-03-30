const { mergeWithCustomize } = require('webpack-merge');
const { extendDefaultPlugins } = require('svgo');

exports.merge = mergeWithCustomize({
  customizeArray(a, b, key) {
    if (key === 'plugins') {
      // SVGO doesn't expose `resolvePluginConfig`, so this is the only reliable way
      // to resolve the list of plugins for comparison.
      const plugins = extendDefaultPlugins(a);
      const newPlugins = extendDefaultPlugins(b);

      newPlugins.forEach(newPlugin => {
        const index = plugins.findIndex(originalPlugin => originalPlugin.name === newPlugin.name);
        if(index === -1) {
          plugins.push(newPlugin);
        } else {
          plugins[index] = newPlugin;
        }
      });

      return plugins;
    }

    // Fall back to default merging
    return undefined;
  }
});
