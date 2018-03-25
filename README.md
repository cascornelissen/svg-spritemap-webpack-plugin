# SVG Spritemap Webpack Plugin
[![npm](https://img.shields.io/npm/v/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![npm](https://img.shields.io/npm/dm/svg-spritemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svg-spritemap-webpack-plugin)
[![license](https://img.shields.io/github/license/cascornelissen/svg-spritemap-webpack-plugin.svg?style=flat-square)](LICENSE.md)

This [webpack](https://webpack.github.io/) plugin generates a single SVG spritemap containing multiple `<symbol>` elements from all `.svg` files in a directory. In addition, it can also generate a stylesheet containing the sprites to be used directly in your CSS. Chris Coyier has a good write-up about the why's and how's of this technique on [CSS Tricks](https://css-tricks.com/svg-symbol-good-choice-icons/). Use it in combination with the [`svg4everybody`](https://github.com/jonathantneal/svg4everybody) package to easily and correctly load SVGs from the spritemap in all browsers.

**Compatibility**  
Version `^2.0.0` of this plugin is compatible with webpack `^4.0.0`. If you're using an older version of webpack, make sure to install the `^1.0.0` (`svg-spritemap-webpack-plugin@^1.0.0`) release of this plugin.

## Installation
```shell
npm install svg-spritemap-webpack-plugin --save-dev
```

## Usage
**Webpack configuration**  
This plugin can be added to webpack like any other, the options are listed down below.
```js
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

**SVG element**  
Say you have a sprite named `phone.svg` in your source directory and the `prefix` option is set to `sprite-` (default), you can then include the sprite in your HTML like so: 
```html
<svg>
    <use xlink:href="/path/to/spritemap.svg#sprite-phone"></use>
</svg>
```


## Options
You can pass an object containing several options to `SVGSpritemapPlugin()`, this object can contain the following keys, the default values for these options are listed behind the option name.

### `src` – `'**/*.svg'`  
Pattern for [`glob`](http://npmjs.com/package/glob) used to find the SVGs that should be in the spritemap.

### `filename` – `'spritemap.svg'`  
Filename of the generated file (located at the webpack `output.path`), `[hash]` and `[contenthash]` are supported.

### `prefix` – `'sprite-'`  
Prefix added to sprite `id` in the spritemap. It will be used for the class/spritename in the generated styles as well. 

### `gutter` – `2`  
Amount of pixels added between each sprite to prevent overlap.

### `styles` – `false`  
Filename for the generated styles file (CSS, SCSS, LESS). This allows you to use the sprites within your CSS instead of via a `<svg>` element in your HTML. Although the latter method is preferred, you might come across situations where extra HTML elements are not feasible. 

The file that's generated will be placed in a different location depending on the value you specify.

- `false`  
  Disable generating the styles file.
- `'filename.ext'`  
  Add the styles file to the webpack assets, this will result in the file being written to the webpack `output.path`.
- `'/path/to/filename.ext'`  
  Write the styles file to a specific directory.
- `'~filename.ext'`  
  Write the styles file to the plugin directory. This allows you to import it from a JavaScript bundle or Sass very easily:
  
  ```js
  // Import it from a JavaScript bundle (styles: '~sprites.css')
  require('svg-spritemap-webpack-plugin/sprites.css');
  ```
  ```scss
  // Import it from Sass (styles: '~sprites.scss')
  @import '~svg-spritemap-webpack-plugin/sprites';
  ```

The value for this option should end in a supported styles extension and the generated file will have language-specific content:

- `.css`  
  Generates a class-based stylesheet where the classnames are equal to the spritename (including prefix) containing the sprite as a `background-image`.
- `.scss`/`.sass`  
  Generates a [Sass map](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#maps) containing the spritenames (excluding prefix) as keys and the sprite as values, comes with a `sprite()` [mixin](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#mixins).
  
  ```scss
  .example {
      // Using the included sprite() mixin
      @include sprite('phone');
    
      // Using the SVG from the map directly
      background-image: url(map-get($sprites, 'phone'));
  }
  ```
- `.less`  
  Generates [LESS variables](http://lesscss.org/features/#variables-feature-overview) for each sprite based on the spritename (including prefix) with the sprite as value, comes with a `.sprite()` [mixin](http://lesscss.org/features/#mixins-feature).
  
  ```less
    .example {
        // Using the included .sprite() mixin
        .sprite(@sprite-phone);
      
        // Using the SVG variable directly
        background-image: url(@sprite-phone);
    }
    ```

### `svgo` – `true`  
Options object to pass to [`SVG Optimizer`](http://npmjs.com/package/svgo). Note that the `cleanupIDs` plugin will always be disabled because it's required for this kind of SVG spritemap setup.

- `false`  
  Disable the optimizer.
- `true`  
  Enable optimizer with the default SVG Optimizer config.
- `{ ... }`  
  Enable optimizer with your own options object.

### `svg4everybody` – `false`  
Whether to include the [`SVG4Everybody`](https://www.npmjs.com/package/svg4everybody#usage) helper in your entries.

- `false`  
  Don't add the helper.
- `true`  
  Add the helper with a configuration object of `{}`.
- `{ ... }`  
  Add the helper with your own options object.

### `glob` – `{}`  
Options object to pass to [`glob`](http://npmjs.com/package/glob) to find the sprites.


## SVG4Everybody
> [SVG for Everybody](https://github.com/jonathantneal/svg4everybody) adds [SVG External Content](http://css-tricks.com/svg-sprites-use-better-icon-fonts/##Browser+Support) support to [all browsers](http://caniuse.com/svg).

You'll probably want to combine the `svg-spritemap-webpack-plugin` with [`svg4everybody`](https://github.com/jonathantneal/svg4everybody). This can be done by passing an options object to the `svg4everybody` configuration key or by executing SVG4Everybody yourself.

## TODO
- [ ] PNG fallback

## License
This project is [licensed](LICENSE.md) under the [MIT](https://opensource.org/licenses/MIT) license.
