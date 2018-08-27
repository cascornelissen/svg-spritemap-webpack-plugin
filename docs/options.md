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
Passing an object as the second argument allows you to change specific options, this `options` object can be described in a [Flow](https://flow.org/en/docs)-esque way as follows:

```js
new SVGSpritemapPlugin(string | string[], {
    input?: {
        options?: object
    },
    output?: {
        filename?: string,
        chunk?: {
            name?: string,
            keep?: boolean
        },
        svg4everybody?: boolean | object,
        svgo?: boolean | object
    },
    sprite?: {
        prefix?: string | false,
        gutter?: number | false,
        generate?: {
            title?: boolean,
            use?: boolean,
            view?: boolean
        }
    },
    styles?: boolean | string | {
        filename?: string,
        format?: string,
        variables?: {
            sprites?: string,
            variables?: string
        }
    }
});
```

---

## `pattern`
Pattern (or an array of patterns) for [`glob`](http://npmjs.com/package/glob) used to find the SVGs that should be in the spritemap.

## `options`
### Input
The `input` object contains the configuration for the input of the plugin.

#### `input.options` – `{}`
Options object to pass to [`glob`](http://npmjs.com/package/glob) to find the sprites.


### Output
The `output` object contains the configuration for the main output (SVG) of the plugin.

#### `output.filename` – `'spritemap.svg'`
Filename of the generated file (located at the webpack `output.path`), `[hash]` and `[contenthash]` are supported.

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
Options object to pass to [`SVG Optimizer`](http://npmjs.com/package/svgo). Note that the `cleanupIDs` plugin will always be disabled because it's required for this kind of SVG spritemap setup.

- `false`  
  Disable the optimizer.
- `true`  
  Enable optimizer with the default SVG Optimizer config.
- `{ ... }`  
  Enable optimizer with a custom options object.


### Sprite
The `sprite` object contains the configuration for the generated sprites in the output spritemap.

#### `sprite.prefix` – `'sprite-'`
Prefix added to sprite `id` in the spritemap. It will be used for the class/spritename in the generated styles as well.

#### `sprite.gutter` – `2`
Amount of pixels added between each sprite to prevent overlap.

#### `sprite.generate.title` - `true`
Whether to generate a `<title>` element containing the filename if no title is provided in the SVG.

#### `sprite.generate.use` - `false`
Whether to include a `<use>` element for each sprite within the generated spritemap to allow referencing symbols from CSS.

#### `sprite.generate.view` - `false`
Whether to include a `<view>` element for each sprite within the generated spritemap to allow referencing via [fragment identifiers](https://css-tricks.com/svg-fragment-identifiers-work/).


### Styles
The `styles` object contains the configuration for the generated styles, it's disabled (`false`) by default.

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
  
  Basic support for [variables using a custom syntax](docs/variables.md) is available when using Sass, this feature allows developers to restyle their sprites on the fly using the `sprite()` mixin.
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

#### `styles.format` – `'data'`
TODO

#### `styles.variables.sprites` – `'sprites'`
TODO

#### `styles.variables.variables` – `'variables'`
TODO
