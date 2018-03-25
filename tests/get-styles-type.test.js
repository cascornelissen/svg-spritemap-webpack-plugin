import SVGSpritemapPlugin from '../lib/';

it('Returns undefined when no styles were passed', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.getStylesType()).toBeUndefined();
});

it('Returns \'asset\' when when a filename is specified', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.getStylesType(' ', 'sprites.css')).toBe('asset');
});

it('Returns \'dir\' when when a directory is specified', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.getStylesType(' ', '/path/to/sprites.css')).toBe('dir');
});

it('Returns \'dir\' when when tilde expansion (home directory) is specified', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.getStylesType(' ', '~/path/to/sprites.css')).toBe('dir');
});

it('Returns \'module\' when when a filename prefixed with a tilde is specified', () => {
    const plugin = new SVGSpritemapPlugin();
    expect(plugin.getStylesType(' ', '~sprites.css')).toBe('module');
});
