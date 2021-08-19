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

Use attribute `data-show-all-suggestions` in order to show an unfiltered list of options.
Only the first matching value is selected.

```html
<select class="form-select" id="validationTags" name="tags[]" multiple data-show-all-suggestions="true">
```

Use attribute `data-allow-clear` in order to add a cross to remove items.

```html
<select class="form-select" id="validationTags" name="tags[]" multiple data-allow-clear="true">
```

Use attribute `data-suggestions-threshold` to determine how many characters need to be typed to show the dropdown (defaults to 1).

```html
<select class="form-select" id="validationTags" name="tags[]" multiple data-suggestions-threshold="0">
```

*NOTE: don't forget the [] if you need multiple values!*

## Tips

- Use arrow down to show dropdown (and arrow up to hide it)
- If you have a really long list of options, a scrollbar will be used

## Demo

https://codepen.io/lekoalabe/pen/ExWYEqx

## How does it look ?

![screenshot](screenshot.png "screenshot")

## I need more

Maybe you can have a look at https://github.com/Honatas/multi-select-webcomponent