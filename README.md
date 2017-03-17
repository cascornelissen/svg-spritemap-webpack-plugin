# SVG Spritemap Webpack Plugin
This [webpack](https://webpack.github.io/) plugin generates a single SVG spritemap containing multiple `<symbol>` elements from all `.svg` files in a directory. Chris Coyier has a good write-up about the why's and how's of this technique on [CSS Tricks](https://css-tricks.com/svg-symbol-good-choice-icons/). Use it in combination with the [`svg4everybody`](https://github.com/jonathantneal/svg4everybody) package to easily and correctly load SVGs from the spritemap in all browsers.

NPM: [`svg-spritemap-webpack-plugin`](https://npmjs.com/package/svg-spritemap-webpack-plugin)

## Installation
```shell
npm install svg-spritemap-webpack-plugin --save-dev
```

## Usage
```js
// webpack.config.js
var SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        new SVGSpritemapPlugin({
            // Optional options object
        })
    ]
}
```

Since [`svg4everybody`](https://github.com/jonathantneal/svg4everybody) requires you to execute the `svg4everybody()` function in your JavaScript this package comes with a helper. Adding the helper to your webpack `entry` will automagically execute this function for you. Read more in the [SVG4Everybody](#svg4everybody) section.

```js
// webpack.config.js
modules.exports = {
    entry: [
        // Your own CSS and JS
        'node_modules/svg-spritemap-webpack-plugin/svg4everybody-helper.js'
    ]
}
```

## Options
You can pass an object containing several options to `SVGSpritemapPlugin()`, this object can contain the following keys.

| Option     | Default           | Description                                                                                                    |
| ---------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `src`      | `'**/*.svg'`      | [`glob`](http://npmjs.com/package/glob) used for finding the SVGs that should be in the spritemap              |
| `glob`     | `{}`              | Options for [`glob`](http://npmjs.com/package/glob)                                                            |
| `svgo`     | `{}`              | Options for [`SVG Optimizer`](http://npmjs.com/package/svgo), pass `false` to disable                          |
| `prefix`   | `''`              | Prefix added to sprite identifier in the spritemap                                                             |
| `gutter`   | `2`               | Amount of pixels added between each sprite to prevent overlap                                                  |
| `filename` | `'spritemap.svg'` | Name for the generated file (located at the webpack `output.path`), `[hash]` and `[contenthash]` are supported |
| `chunk`    | `'spritemap'`     | Name of the generated chunk                                                                                    |

## SVG4Everybody
You probably want to combine the `svg-spritemap-webpack-plugin` with `svg4everybody`.

> [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) adds [SVG External Content](http://css-tricks.com/svg-sprites-use-better-icon-fonts/##Browser+Support) support to [all browsers](http://caniuse.com/svg).

The helper included in this package has the following default options. If you want anything else you'll have to execute the `svg4everybody()` function yourself. More information about the options is available in the [SVG for Everybody README](https://github.com/jonathantneal/svg4everybody/blob/master/README.md).

```js
{
    polyfill: true // Force inline SVG
}
```

## TODO
- PNG fallback
- Tests

## License
This project is [licensed](LICENSE.md) under the [MIT](https://opensource.org/licenses/MIT) license.
