# SVG Spritemap Webpack Plugin
[![npm](https://img.shields.io/npm/v/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![npm](https://img.shields.io/npm/dm/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![codevov](https://img.shields.io/codecov/c/github/cascornelissen/svg-spritemap-webpack-plugin.svg)](https://codecov.io/github/cascornelissen/svg-spritemap-webpack-plugin/)
[![license](https://img.shields.io/github/license/cascornelissen/svg-spritemap-webpack-plugin.svg?style=flat-square)](LICENSE.md)

This [webpack](https://webpack.github.io/) plugin generates a single SVG spritemap containing multiple `<symbol>` elements from all `.svg` files in a directory. In addition, it can optimize the output and can also generate a stylesheet containing the sprites to be used directly from CSS. Chris Coyier has a good write-up about the why's and how's of this technique on [CSS Tricks](https://css-tricks.com/svg-symbol-good-choice-icons/). Use it in combination with the [`svg4everybody`](https://github.com/jonathantneal/svg4everybody) package to easily and correctly load SVGs from the spritemap in all browsers.

**Compatibility**  
Version `^2.0.0` of this plugin is compatible with webpack `^4.0.0`. When using an older version of webpack, make sure to install the `^1.0.0` (`svg-spritemap-webpack-plugin@^1.0.0`) release of this plugin.


## Installation
```shell
npm install svg-spritemap-webpack-plugin --save-dev
```


## Usage
**Webpack configuration**  
This plugin can be added to webpack like any other, [documentation on all configuration options](/docs/options.md) is available.
```js
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');

module.exports = {
    // ...
    plugins: [
        new SVGSpritemapPlugin()
    ]
}
```

**SVG element**  
When there's a file `phone.svg` in the source directory and the `prefix` option is set to `sprite-` (default), the sprite can be included in a HTML-file like so:
```html
<svg>
    <use xlink:href="/path/to/spritemap.svg#sprite-phone"></use>
</svg>
```

## SVG4Everybody
> [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) adds [SVG External Content](http://css-tricks.com/svg-sprites-use-better-icon-fonts/##Browser+Support) support to [all browsers](http://caniuse.com/svg).

It's a good idea to combine the `svg-spritemap-webpack-plugin` with [`svg4everybody`](https://github.com/jonathantneal/svg4everybody). This can be done by passing an options object or `true` to the `svg4everybody` options key or by executing SVG4Everybody manually.


## License
This project is [licensed](LICENSE.md) under the [MIT](https://opensource.org/licenses/MIT) license.
