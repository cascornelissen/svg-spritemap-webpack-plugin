# Variables
One of the benefits of SVGs is the ability to style them through CSS. This plugin is aimed at using inline SVGs using the SVG4Everybody helper but situations may arise where extra HTML elements are not feasible. This is where the [`styles`](https://github.com/cascornelissen/svg-spritemap-webpack-plugin#styles--false) option may come into play as it allows developers to use any sprite as a `background-image` in their Sass/Less/CSS.

A downside to using the sprite as a `background-image` is that you lose the ability to style it and that's what this improvement aims to fix. It will never work as well as using inline SVGs and it adds to the filesize of your CSS bundle but it does allow for changing some basic variables in the inlined sprites.

Note that this feature only works when using [Sass](https://www.sass-lang.com/) since support for object-like variables in the language is required.

## Notation
```
var:[$name.]$attribute="[$defaultvalue]"
```
Component           | Description
------------------- | ------------
**`var`**           | Namespace used to identify variables that should be parsed
**`$name`**         | Name of the variable that can be used to target this value
**`$attribute`**    | Actual attribute (e.g. `fill` or `stroke-width`) that will be added, `var:[$name.]` will be stripped
**`$defaultvalue`** | Optional default value for the attribute

## Examples
### Basics
All attributes namespaced with `var:` will be stripped from their `var:[$name.]` part and added to the spritemap. The Sass and Less mixins will use this information to format the sprite when it's used.

**Input**
```xml
<path var:color.fill="#fff" .../>
```

**Output (spritemap)**
```xml
<path fill="#fff" .../>
```

**Usage in SCSS**
```scss
@include sprite('spritename', (
    color: '#f00'
));

// Result:
// <path fill="#f00" .../>
```
```scss
@include sprite('spritename');

// Result:
// <path fill="#fff" .../>
```

---

### Empty default value
Values can be left empty when no default is needed. Attributes with an empty value will be stripped by SVGO when `removeEmptyAttrs` is enabled, which it is by default.

**Input**
```xml
<path var:color.fill="" .../>
```

**Output (spritemap)**
```xml
<path fill="" .../>
```

**Usage in SCSS**
```scss
@include sprite('spritename', (
    color: '#f00'
));

// Result:
// <path fill="#f00" .../>
```
```scss
@include sprite('spritename');

// Result:
// <path .../>
```

---

### Re-using variables
It's possible to use a single variable multiple times, this works across the entire sprite and it doesn't matter what the `$attribute` is. Note that default values can be different for attributes sharing the same variable.

**Input**
```xml
<g var:color.id="">
    <path var:color.fill="#fff" .../>
    <path var:color.stroke="#fff" .../>
</g>
```

**Output (spritemap)**
```xml
<g id="">
    <path fill="#fff" .../>
    <path stroke="#fff" .../>
</g>
```

**Usage in SCSS**
```scss
@include sprite('spritename', (
    color: '#f00'
));

// Result:
// <g id="#f00">
//     <path fill="#f00" .../>
//     <path stroke="#f00" .../>
// </g>
```
```scss
@include sprite('spritename');

// Result:
// <g>
//     <path fill="#fff" .../>
//     <path stroke="#fff" .../>
// </g>
```

---

### Short notation
Skipping the `$name` in the notation forces the variable name to equal the value of `$attribute`: i.e. `var:fill.fill=""` is equal to `var:fill=""`. This might improve readability when using a small amount of variables in a single sprite but will obviously result in problems when trying to use multiple variables for the same attribute.

**Input**
```xml
<path var:fill="#fff" .../>
```

**Output (spritemap)**
```xml
<path fill="#fff" .../>
```

**Usage in SCSS**
```scss
@include sprite('spritename');

// Result:
// <path fill="#fff" .../>
```
