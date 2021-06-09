# bootstrap5-tags

[![NPM](https://nodei.co/npm/bootstrap5-tags.png?mini=true)](https://nodei.co/npm/bootstrap5-tags/) 
[![Downloads](https://img.shields.io/npm/dt/bootstrap5-tags.svg)](https://www.npmjs.com/package/bootstrap5-tags)

## How to use

An ES6 native replacement for `select` using standards Bootstrap 5 styles.

No additional CSS needed! Supports creation of new tags.

```js
import Tags from "./tags.js";
Tags.init();
```

By default, only provided options are available. Validation error
will be displayed in case of invalid tag.

```html
<label for="validationTags" class="form-label">Tags</label>
<select class="form-select" id="validationTags" name="tags[]" multiple>
    <option selected disabled hidden value="">Choose a tag...</option>
    <option value="1" selected="selected">Apple</option>
    <option value="2">Banana</option>
    <option value="3">Orange</option>
</select>
<div class="invalid-feedback">Please select a valid tag.</div>
```

Use attribute `data-allow-new` to allow creation of new tags. Their
default value will be equal to the text. Since you can enter
arbitrary text, no validation will occur.

```html
<select class="form-select" id="validationTags" name="tags[]" multiple data-allow-new="true">
```

*NOTE: don't forget the [] if you need multiple values!*

## Demo

https://codepen.io/lekoalabe/pen/ExWYEqx

## How does it look ?

![screenshot](screenshot.png "screenshot")

## I need more

Maybe you can have a look at https://github.com/Honatas/multi-select-webcomponent