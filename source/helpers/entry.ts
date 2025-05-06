import webpack from 'webpack';

export const applyEntryPlugin = (compiler: webpack.Compiler, context: string, entries: string[], name = 'main') => {
    entries.forEach((entry) => {
        const plugin = new webpack.EntryPlugin(context, entry, name);

        plugin.apply(compiler);
    });
};
