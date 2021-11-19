# Options
The `SVGSpritemapPlugin()` supports 2 arguments as input, the first being a [`glob`](https://www.npmjs.com/package/glob) pattern that will be used to find the sprites, the second is an optional object containing additional configuration options.

**Simple usage**  
Adding the plugin without passing any options will result in all the defaults being used.

```js
new SVGSpritemapPlugin();
```

Passing a string or an array of strings allows you to change the default pattern.

```js
new SVGSpritemapPlugin('images/sprites/**/*.svg');

new SVGSpritemapPlugin([
    'images/logos/**/*.svg',
    'images/icons/**/*.svg'
]);
```

**Advanced usage**  
Passing an object as the second argument allows you to change specific options, this `options` object can be described in a [TypeScript](https://www.typescriptlang.org/) interface as follows:

```js
new SVGSpritemapPlugin(string | string[], {
    input?: {
        options?: object,
        allowDuplicates?: boolean,
    },
    output?: {
        filename?: string,
        svg?: {
            sizes?: boolean,
            attributes?: object
        },
        chunk?: {
            name?: string,
            keep?: boolean
        },
        svg4everybody?: boolean | object,
        svgo?: boolean | object
    },
    sprite?: {
        prefix?: string | (file) => string | false,
        gutter?: number | false,
        generate?: {
            title?: boolean,
            symbol?: boolean | string,
            use?: boolean,
            view?: boolean | string
        }
    },
    styles?: boolean | string | {
        filename?: string,
        format?: 'data' | 'fragment',
        keepAttributes?: boolean,
        variables?: {
            sprites?: string,
            sizes?: string,
            variables?: string,
            mixin?: string
        },
        callback?: (content) => string
    }
});
```

---

## `pattern` - `'**/*.svg'`
Pattern (or an array of patterns) for [`glob`](http://npmjs.com/package/glob) used to find the SVGs that should be in the spritemap.

## `options`
### Input
The `input` object contains the configuration for the input of the plugin.

#### `input.options` – `{}`
Options object to pass to [`glob`](http://npmjs.com/package/glob) to find the sprites.

#### `input.allowDuplicates` – `false`
Allow the usage of the same input SVG multiple times. This option work well together with the `sprite.idify` option to set a different name in the output file.

### Output
The `output` object contains the configuration for the main output (SVG) of the plugin.

#### `output.filename` – `'spritemap.svg'`
Filename of the generated file (located at the webpack `output.path`), `[hash]` and `[contenthash]` are supported.

#### `output.svg.sizes`
Whether to include the `width` and `height` attributes on the root SVG element. The default value for this option is based on the value of the `sprite.generate.use` option but when specified will always overwrite it.

#### `output.svg.attributes` -- `{}`
Custom attributes to add to the root SVG element. This should be an object, with `key` attribute names, and `value` attribute values, e.g. `{ id: 'my-svg-id' }`. By default no attributes will be added.

#### `output.chunk.name` – `'spritemap'`
Name of the chunk that will be generated.

#### `output.chunk.keep` – `false`
Whether to keep the chunk after it's been emitted by webpack.

#### `output.svg4everybody` – `false`
Whether to include the [`SVG4Everybody`](https://www.npmjs.com/package/svg4everybody#usage) helper in your entries.

- `false`  
  Don't add the helper.
- `true`  
  Add the helper with a configuration object of `{}`.
- `{ ... }`  
  Add the helper with a custom options object.

#### `output.svgo` – `true`
Options object to pass to [`SVG Optimizer`](http://npmjs.com/package/svgo).

- `false`  
  Disable the optimizer.
- `true`  
  Enable optimizer with the default SVG Optimizer config.
- `{ ... }`  
  Enable optimizer with a custom options object.


### Sprite
The `sprite` object contains the configuration for the generated sprites in the output spritemap.

#### `sprite.prefix` – `'sprite-'`
Prefix added to sprite `id` in the spritemap. It's possible to pass a function for more advanced situations, the full path to the current sprite will be passed as the first argument.

This value will also be used for the class/spritename in the generated styles, the exact implementation and usage differs between style implementations follows:

- `.css`  
  Used as a prefix for the classname.
- `.scss`/`.sass`  
  Stripped from the variable name since the Sass implementation is based on [maps](https://sass-lang.com/documentation/values/maps).
- `.less`  
  Used as a prefix for the variable.

#### `sprite.prefixStylesSelectors` – `false`
Whether to also prefix any selectors that are generated in the styles file, if enabled.

#### `sprite.idify` – `idify`
Function that will be used to transform the filename of each sprite into a valid HTML `id`. The default function strips all whitespace as this is the only restriction according to the HTML5 specification. Passing `false` will result in the filename getting used as-is.

```es6
// Generate HTML5 id's
(filename) => filename.replace(/[\s]+/g, '-');
```

#### `sprite.gutter` – `0`
Amount of pixels added between each sprite to prevent overlap.

#### `sprite.generate.title` - `true`
Whether to generate a `<title>` element containing the filename if no title is provided in the SVG.

#### `sprite.generate.symbol` - `true`
Whether to include a `<symbol>` element for each sprite within the generated spritemap. Passing a string will use the value as a postfix for the `id` attribute.

#### `sprite.generate.use` - `false`
Whether to include a `<use>` element for each sprite within the generated spritemap to allow referencing symbols from CSS.

#### `sprite.generate.view` - `false`
Whether to include a `<view>` element for each sprite within the generated spritemap to allow referencing via [fragment identifiers](https://css-tricks.com/svg-fragment-identifiers-work/). Passing a string will use the value as a postfix for the `id` attribute.


### Styles
The `styles` object contains the configuration for the generated styles, it's disabled (`false`) by default. A string can be used as the value which will then be used for the `styles.filename` option.

#### `styles.filename` – `'~sprites.css'`
Filename for the generated styles file (CSS, SCSS, LESS). This allows for using the sprites within a CSS-file instead of through a `<svg>` element in HTML. Although the latter method is preferred, situations may arise where extra HTML elements are not feasible.

The file that's generated will be placed in a different location depending on the value specified.

- `'filename.ext'`  
  Add the styles file to the webpack assets, this will result in the file being written to the webpack `output.path`, `[hash]` and `[contenthash]` are supported.
- `'/path/to/filename.ext'`  
  Write the styles file to a specific directory.
- `'~filename.ext'`  
  Write the styles file to the plugin directory. This allows for importing it from a JavaScript bundle or Sass very easily:

  ```js
  // Import it from a JavaScript bundle (styles: '~sprites.css')
  require('svg-spritemap-webpack-plugin/sprites.css');
  ```
  ```scss
  // Import it from Sass (styles: '~sprites.scss')
  @import '~svg-spritemap-webpack-plugin/sprites';
  ```

The value for the `styles` option should end in a supported style extension and the generated file will have language-specific content:

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
  
  Basic support for [variables using a custom syntax](/docs/variables.md) is available when using Sass, this feature allows developers to restyle their sprites on the fly using the `sprite()` mixin.
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

#### `styles.keepAttributes` – `false`
Whether to include the original SVG attributes in the generated styles.

#### `styles.format` – `'data'`
Format of the styles that will be generated, the following values are valid:

- `'data'`  
  Generates [data URIs](https://www.npmjs.com/package/mini-svg-data-uri) as background `url()`s.
- `'fragment'`  
  Generates URLs with [fragment identifiers](https://css-tricks.com/svg-fragment-identifiers-work/) as background `url()`s. This requires the `sprite.generate.view` option to be enabled and uses the webpack option [`output.publicPath`](https://webpack.js.org/configuration/output/#output-publicpath) to build a URL to the file. This type of setup requires some additional configuration, [see example](../examples/fragments) for more information.

#### `styles.variables.sprites` – `'sprites'`
Name for the SCSS variable that is used for the Sass map containing sprites.

#### `styles.variables.sizes` – `'sizes'`
Name for the SCSS variable that is used for the Sass map containing size information for each sprite.

#### `styles.variables.variables` – `'variables'`
Name for the SCSS variable that is used for the Sass map containing [user-defined variables](variables.md).

#### `styles.variables.mixin` – `'sprite'`
Name for the SCSS variable that is used for the Sass mixin.

#### `styles.callback` – `undefined`
Provide a callback function to process the styles content before it is saved.

```es6
(content) => `[class*="sprite-"] { background-size: cover; } ${content}`
```
