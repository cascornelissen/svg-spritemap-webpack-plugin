# SVG Spritemap Webpack Plugin
[![npm](https://img.shields.io/npm/v/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![npm](https://img.shields.io/npm/dm/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![license](https://img.shields.io/github/license/cascornelissen/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://github.com/cascornelissen/svg-spritemap-webpack-plugin/blob/webpack4/LICENSE.md)

This [webpack](https://webpack.github.io/) plugin generates a single SVG spritemap containing multiple `<symbol>` elements from all `.svg` files in a directory. Chris Coyier has a good write-up about the why's and how's of this technique on [CSS Tricks](https://css-tricks.com/svg-symbol-good-choice-icons/). Use it in combination with the [`svg4everybody`](https://github.com/jonathantneal/svg4everybody) package to easily and correctly load SVGs from the spritemap in all browsers.

NPM: [`svg-spritemap-webpack-plugin`](https://npmjs.com/package/svg-spritemap-webpack-plugin)

## Installation
```shell
npm install svg-spritemap-webpack-plugin --save-dev
```

## Usage
```js
// webpack.config.js
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        new SVGSpritemapPlugin({
            // Optional options object
        })
    ]
}
```

## Options
You can pass an object containing several options to `SVGSpritemapPlugin()`, this object can contain the following keys.

| Option          | Default           | Description                                                                                                                                         |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`           | `'**/*.svg'`      | [`glob`](http://npmjs.com/package/glob) used for finding the SVGs that should be in the spritemap                                                   |
| `glob`          | `{}`              | Options object for [`glob`](http://npmjs.com/package/glob#options)                                                                                  |
| `svgo`          | `{}`              | Options object for [`SVG Optimizer`](http://npmjs.com/package/svgo), pass `false` to disable - note that the `cleanupIDs` plugin is always disabled |
| `svg4everybody` | `false`           | Options object for [`SVG4Everybody`](https://www.npmjs.com/package/svg4everybody#usage)                                                             |
| `gutter`        | `2`               | Amount of pixels added between each sprite to prevent overlap                                                                                       |
| `prefix`        | `'sprite-'`       | Prefix added to sprite identifier in the spritemap                                                                                                  |
| `filename`      | `'spritemap.svg'` | Name for the generated file (located at the webpack `output.path`), `[hash]` and `[contenthash]` are supported                                      |
| `chunk`         | `'spritemap'`     | Name of the generated chunk                                                                                                                         |
| `deleteChunk`   | `true`            | Deletes the chunked file `chunk` after packing is complete                                                                                          |


## SVG4Everybody
> [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) adds [SVG External Content](http://css-tricks.com/svg-sprites-use-better-icon-fonts/##Browser+Support) support to [all browsers](http://caniuse.com/svg).

You'll probably want to combine the `svg-spritemap-webpack-plugin` with [`svg4everybody`](https://github.com/jonathantneal/svg4everybody). This can be done by passing an options object to the `svg4everybody` configuration key or by executing SVG4Everybody yourself.

## TODO
- PNG fallback

## License
This project is [licensed](LICENSE.md) under the [MIT](https://opensource.org/licenses/MIT) license.
