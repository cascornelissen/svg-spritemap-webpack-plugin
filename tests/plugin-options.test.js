import formatOptions from '../lib/options-formatter';

describe('Input rewriting', () => {
    it('Transforms a string pattern to an array with the single pattern', () => {
        const pattern = 'a';
        const output = formatOptions(pattern);

        expect(output.input.patterns).toEqual([pattern]);
    });

    it('Updates the \'sprite.prefix\' option value from `false` to `\'\'`', () => {
        const output = formatOptions({
            sprite: {
                prefix: false
            }
        });

        expect(output.sprite.prefix).toEqual('');
    });

    it('Updates the \'sprite.gutter\' option value from `false` to `0`', () => {
        const output = formatOptions({
            sprite: {
                gutter: false
            }
        });

        expect(output.sprite.gutter).toEqual(0);
    });

    it('Updates the \'styles\' option value from `true` to an object', () => {
        const output = formatOptions({
            styles: true
        });

        expect(typeof output.styles === 'object' && output.styles !== null).toBe(true);
    });
});

it('Throws when something other than a plain object is supplied for the options parameter', () => {
    expect(() => {
        formatOptions(null, null);
    }).toThrow();
});

it('Throws when an invalid configuration is supplied', () => {
    expect(() => {
        formatOptions({
            a: 'a'
        })
    }).toThrow();
});

it('Merges supplied options into the options object', () => {
    const filename = 'test';
    const output = formatOptions({
        output: {
            filename: filename
        }
    });

    expect(output.output.filename).toBe(filename);
});

it('Throws when the SVGO cleanupIDs plugin gets overwritten', () => {
    expect(() => {
        formatOptions({
            svgo: {
                plugins: [{
                    cleanupIDs: true
                }]
            }
        });
    }).toThrow();
});
