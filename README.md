# SVG Spritemap Webpack Plugin
[![npm](https://img.shields.io/npm/v/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![npm](https://img.shields.io/npm/dm/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![license](https://img.shields.io/github/license/cascornelissen/svg-spritemap-webpack-plugin.svg?style=flat-square)](LICENSE.md)

This [webpack][webpack] plugin generates a single SVG spritemap containing multiple `<symbol>` elements from all `.svg`
files in a directory. In addition, it can optimize the output and can also generate a stylesheet containing the sprites
to be used directly from CSS. Chris Coyier has a good write-up about the why's and how's of this technique on
[CSS Tricks][css-tricks-article]. Use it in combination with the [`svg4everybody`][svg4everybody] package to easily and
correctly load SVGs from the spritemap in all browsers.


## Installation
```shell
npm install svg-spritemap-webpack-plugin --save-dev
```


## Usage
**Webpack configuration**  
This plugin can be added to webpack like any other, [documentation on all configuration options](/docs/options.md) is available.

```js
import SVGSpritemapPlugin from 'svg-spritemap-webpack-plugin';

export default {
    // ...
    plugins: [
        new SVGSpritemapPlugin()
    ]
}
```

**SVG element**  
When there's a file `phone.svg` in the source directory and the `prefix` option is set to `sprite-` (default),
the sprite can be included in a HTML-file like so:

```xml
<svg>
    <use xlink:href="/path/to/spritemap.svg#sprite-phone"></use>
</svg>
```


## SVG4Everybody
> [SVG for Everybody][svg4everybody] adds [SVG External Content][svg-external-content-support] support to [all browsers][can-i-use-svg].

It's a good idea to combine the `svg-spritemap-webpack-plugin` with [`svg4everybody`][svg4everybody]. This can be done
by passing an options object or `true` to the `svg4everybody` options key or by initializing SVG4Everybody manually.


## License
This project is [licensed](LICENSE.md) under the [MIT](https://opensource.org/licenses/MIT) license.



[webpack]: https://webpack.github.io/
[css-tricks-article]: https://css-tricks.com/svg-symbol-good-choice-icons/
[svg4everybody]: https://github.com/jonathantneal/svg4everybody
[svg-external-content-support]: http://css-tricks.com/svg-sprites-use-better-icon-fonts/##Browser+Support
[can-i-use-svg]: http://caniuse.com/svg
