import webpack from 'webpack';
import SVGSpritemapPlugin from '../svg-spritemap';

it('Throws when the entry to which the svg4everybody helper will be added is of an unsupported type', () => {
    expect(() => {
        webpack({
            entry: () => {},
            plugins: [
                new SVGSpritemapPlugin({
                    src: 'src/**/*.svg',
                    svg4everybody: true
                })
            ]
        });
    }).toThrow();
});

// TODO: Test for entry of type string
// TODO: Test for entry of type array
// TODO: Test for entry of type object
