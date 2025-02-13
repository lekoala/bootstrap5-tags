# Tags for Bootstrap 4/5

[![NPM](https://nodei.co/npm/bootstrap5-tags.png?mini=true)](https://nodei.co/npm/bootstrap5-tags/)
[![Downloads](https://img.shields.io/npm/dt/bootstrap5-tags.svg)](https://www.npmjs.com/package/bootstrap5-tags)

## How to use

An ES6 native replacement for `select` using standards Bootstrap 5 (and 4) styles.

(almost) No additional CSS needed! Supports creation of new tags.

```js
import Tags from "./tags.js";
Tags.init();
// Tags.init(selector, opts);
// You can pass global settings in opts that will apply
// to all Tags instances
```

By default, only provided options are available. Validation error
will be displayed in case of invalid tag.

```html
<label for="tags-input" class="form-label">Tags</label>
<select class="form-select" id="tags-input" name="tags[]" multiple>
  <option disabled hidden value="">Choose a tag...</option>
  <option value="1" selected="selected">Apple</option>
  <option value="2">Banana</option>
  <option value="3">Orange</option>
</select>
<div class="invalid-feedback">Please select a valid tag.</div>
```

## Creation of new tags

Use attribute `data-allow-new` to allow creation of new tags. Their
default value will be equal to the text. Since you can enter
arbitrary text, no validation will occur.

```html
<select class="form-select" id="tags-input" name="tags[]" multiple data-allow-new="true"></select>
```

You can force these new tags to respect a given regex.

_NOTE: don't forget the [] if you need multiple values!_

## Server side support

You can also use options provided by the server. This script expects a json response that is an array or an object with the data key containing an array.

Simply set `data-server` where your endpoint is located. It should provide an array of value/label objects. The suggestions will be populated upon init
except if `data-live-server` is set, in which case, it will be populated on type. A ?query= parameter is passed along with the current value of the searchInput.

You can preselect values either by using `data-selected` or by marking the suggestion as `selected` in the json result.

```html
<label for="validationTagsJson" class="form-label">Tags (server side)</label>
<select
  class="form-select"
  id="validationTagsJson"
  name="tags_json[]"
  multiple
  data-allow-new="true"
  data-server="demo.json"
  data-live-server="1"
>
  <option disabled hidden value="">Choose a tag...</option>
</select>
```

You can pass additionnal parameters with `data-server-params` and choose the method with `data-server-method` (GET or POST).

## Setting data programmatically

You can use the `items` config key to pass options. These will be added to the select object.
Items can be an array of Suggestions, or a key:value object.

You can also call `setData` manually.

## Options

Options can be either passed to the constructor (eg: optionName) or in data-option-name format. You can also use the `data-config` attribute with a json encoded string.

| Name                 | Type                                                     | Description                                                                                             |
|----------------------|----------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| items                | <code>Array.&lt;(Suggestion\|SuggestionGroup)&gt;</code> | Source items                                                                                            |
| allowNew             | <code>Boolean</code>                                     | Allows creation of new tags                                                                             |
| showAllSuggestions   | <code>Boolean</code>                                     | Show all suggestions even if they don't match. Disables validation.                                     |
| badgeStyle           | <code>String</code>                                      | Color of the badge (color can be configured per option as well)                                         |
| allowClear           | <code>Boolean</code>                                     | Show a clear icon                                                                                       |
| clearEnd             | <code>Boolean</code>                                     | Place clear icon at the end                                                                             |
| selected             | <code>Array</code>                                       | A list of initially selected values                                                                     |
| regex                | <code>String</code>                                      | Regex for new tags                                                                                      |
| separator            | <code>Array</code> \| <code>String</code>                | A list (pipe separated) of characters that should act as separator (default is using enter key)         |
| max                  | <code>Number</code>                                      | Limit to a maximum of tags (0 = no limit)                                                               |
| placeholder          | <code>String</code>                                      | Provides a placeholder if none are provided as the first empty option                                   |
| clearLabel           | <code>String</code>                                      | Text as clear tooltip                                                                                   |
| searchLabel          | <code>String</code>                                      | Default placeholder                                                                                     |
| showDropIcon         | <code>Boolean</code>                                     | Show dropdown icon                                                                                      |
| keepOpen             | <code>Boolean</code>                                     | Keep suggestions open after selection, clear on focus out                                               |
| allowSame            | <code>Boolean</code>                                     | Allow same tags used multiple times                                                                     |
| baseClass            | <code>String</code>                                      | Customize the class applied to badges                                                                   |
| addOnBlur            | <code>Boolean</code>                                     | Add new tags on blur (only if allowNew is enabled)                                                      |
| showDisabled         | <code>Boolean</code>                                     | Show disabled tags                                                                                      |
| hideNativeValidation | <code>Boolean</code>                                     | Hide native validation tooltips                                                                         |
| suggestionsThreshold | <code>Number</code>                                      | Number of chars required to show suggestions                                                            |
| maximumItems         | <code>Number</code>                                      | Maximum number of items to display                                                                      |
| autoselectFirst      | <code>Boolean</code>                                     | Always select the first item                                                                            |
| updateOnSelect       | <code>Boolean</code>                                     | Update input value on selection (doesn't play nice with autoselectFirst)                                |
| highlightTyped       | <code>Boolean</code>                                     | Highlight matched part of the suggestion                                                                |
| highlightClass       | <code>String</code>                                      | Class applied to the mark element                                                                       |
| fullWidth            | <code>Boolean</code>                                     | Match the width on the input field                                                                      |
| fixed                | <code>Boolean</code>                                     | Use fixed positioning (solve overflow issues)                                                           |
| fuzzy                | <code>Boolean</code>                                     | Fuzzy search                                                                                            |
| startsWith           | <code>Boolean</code>                                     | Must start with the string. Defaults to false (it matches any position).                                |
| singleBadge          | <code>Boolean</code>                                     | Show badge for single elements                                                                          |
| activeClasses        | <code>Array</code>                                       | By default: ["bg-primary", "text-white"]                                                                |
| labelField           | <code>String</code>                                      | Key for the label                                                                                       |
| valueField           | <code>String</code>                                      | Key for the value                                                                                       |
| searchFields         | <code>Array</code>                                       | Key for the search                                                                                      |
| queryParam           | <code>String</code>                                      | Name of the param passed to endpoint (query by default)                                                 |
| server               | <code>String</code>                                      | Endpoint for data provider                                                                              |
| serverMethod         | <code>String</code>                                      | HTTP request method for data provider, default is GET                                                   |
| serverParams         | <code>String</code> \| <code>Object</code>               | Parameters to pass along to the server. You can specify a "related" key with the id of a related field. |
| serverDataKey        | <code>String</code>                                      | By default: data                                                                                        |
| fetchOptions         | <code>Object</code>                                      | Any other fetch options (https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax)                 |
| liveServer           | <code>Boolean</code>                                     | Should the endpoint be called each time on input                                                        |
| noCache              | <code>Boolean</code>                                     | Prevent caching by appending a timestamp                                                                |
| allowHtml            | <code>Boolean</code>                                     | Allow html in input (can lead to script injection)                                                      |
| inputFilter          | <code>function</code>                                    | Function to filter input                                                                                |
| sanitizer            | <code>function</code>                                    | Alternative function to sanitize content                                                                |
| debounceTime         | <code>Number</code>                                      | Debounce time for live server                                                                           |
| notFoundMessage      | <code>String</code>                                      | Display a no suggestions found message. Leave empty to disable                                          |
| onRenderItem         | [<code>RenderCallback</code>](#RenderCallback)           | Callback function that returns the suggestion                                                           |
| onSelectItem         | [<code>ItemCallback</code>](#ItemCallback)               | Callback function to call on selection                                                                  |
| onClearItem          | [<code>ValueCallback</code>](#ValueCallback)             | Callback function to call on clear                                                                      |
| onCreateItem         | [<code>CreateCallback</code>](#CreateCallback)           | Callback function when an item is created                                                               |
| onBlur               | [<code>EventCallback</code>](#EventCallback)             | Callback function on blur                                                                               |
| onDataLoaded         | [<code>DataCallback</code>](#DataCallback)               | Callback function on data load                                                                          |
| onFocus              | [<code>EventCallback</code>](#EventCallback)             | Callback function on focus                                                                              |
| onCanAdd             | [<code>AddCallback</code>](#AddCallback)                 | Callback function to validate item. Return false to show validation message.                            |
| onServerResponse     | [<code>ServerCallback</code>](#ServerCallback)           | Callback function to process server response. Must return a Promise                                     |
| onServerError        | [<code>ErrorCallback</code>](#ErrorCallback)             | Callback function to process server errors.                                                             |
| confirmClear         | [<code>ModalItemCallback</code>](#ModalItemCallback)     | Allow modal confirmation of clear. Must return a Promise                                                |
| confirmAdd           | [<code>ModalItemCallback</code>](#ModalItemCallback)     | Allow modal confirmation of add. Must return a Promise                                                  |

Any of these config option can be changed later with `setConfig`.

To know more about these features, check the demo!

## Callbacks

<a name="DataCallback"></a>

### DataCallback ⇒ <code>void</code>

| Param | Type                       |
|-------|----------------------------|
| src   | <code>*</code>             |
| inst  | [<code>Tags</code>](#Tags) |

<a name="EventCallback"></a>

### EventCallback ⇒ <code>void</code>

| Param | Type                       |
|-------|----------------------------|
| event | <code>Event</code>         |
| inst  | [<code>Tags</code>](#Tags) |

<a name="ServerCallback"></a>

### ServerCallback ⇒ <code>Promise</code>

| Param    | Type                  |
|----------|-----------------------|
| response | <code>Response</code> |

<a name="ErrorCallback"></a>

## ErrorCallback ⇒ <code>void</code>

| Param  | Type                       |
|--------|----------------------------|
| e      | <code>Error</code>         |
| signal | <code>AbortSignal</code>   |
| inst   | [<code>Tags</code>](#Tags) |

<a name="ModalItemCallback"></a>

### ModalItemCallback ⇒ <code>Promise</code>

| Param | Type                       |
|-------|----------------------------|
| label | <code>String</code>        |
| inst  | [<code>Tags</code>](#Tags) |

<a name="RenderCallback"></a>

### RenderCallback ⇒ <code>String</code>

| Param | Type                                   |
|-------|----------------------------------------|
| item  | [<code>Suggestion</code>](#Suggestion) |
| label | <code>String</code>                    |
| inst  | [<code>Tags</code>](#Tags)             |

<a name="ItemCallback"></a>

### ItemCallback ⇒ <code>void</code>

| Param | Type                                   |
|-------|----------------------------------------|
| item  | [<code>Suggestion</code>](#Suggestion) |
| inst  | [<code>Tags</code>](#Tags)             |

<a name="ValueCallback"></a>

### ValueCallback ⇒ <code>void</code>

| Param | Type                       |
|-------|----------------------------|
| value | <code>String</code>        |
| inst  | [<code>Tags</code>](#Tags) |

<a name="AddCallback"></a>

### AddCallback ⇒ <code>void</code> \| <code>Boolean</code>

| Param | Type                       |
|-------|----------------------------|
| value | <code>String</code>        |
| data  | <code>Object</code>        |
| inst  | [<code>Tags</code>](#Tags) |

<a name="CreateCallback"></a>

### CreateCallback ⇒ <code>void</code>

| Param  | Type                           |
|--------|--------------------------------|
| option | <code>HTMLOptionElement</code> |
| inst   | [<code>Tags</code>](#Tags)     |

## Tips

- You can also use it on single selects! :-)
- Use arrow down to show dropdown
- If you have a really long list of options, a scrollbar will be used
- Access Tags instance on a given element with Tags.getInstance(mySelect)

## Custom events

- tags.blur is fired alongside onBlur
- tags.loaded is fired alongside onDataLoaded

## Style

While styling is not mandatory, some pseudo styles may help align your styles with a regular bootstrap form-control
We basically replicate input state as pseudo classes on the form-control container

- Support focus styles by implementing a pseudo class `form-control-focus`
- Support improved floating labels by implementing a pseudo class `form-placeholder-shown`
- Support disabled styles by implementing a pseudo class `form-control-disabled`

These styles can be found in `_tags.scss`

You can also use the `tags-pure.scss` file which provide you a css vars only version of the required styles (works well with bootstrap 5.3)

## Without Bootstrap 5

### Bootstrap 4 support

Even if it was not the initial idea to support Bootstrap 4, this component is now compatible with Bootstrap 4 because it only
requires minimal changes.

Check out demo-bs4.html

### Standalone usage

Obviously, this package works great with the full bootstrap library, but you can also use it without Bootstrap or with a trimmed down version of it

Actually, this library doesn't even use the js library to position the dropdown menu, so its only dependencies is on css classes.
You can check out the .scss file to see how to reduce bootstrap 5 css to a smaller size.

Check out demo-standalone.html

## Demo

https://codepen.io/lekoalabe/pen/ExWYEqx

## How does it look ?

![screenshot](screenshot.png "screenshot")

## Do you need to init this automagically ?

You can now use this as a custom element as part of my [Formidable Elements](https://github.com/lekoala/formidable-elements) collection.

Or you can use [Modular Behaviour](https://github.com/lekoala/modular-behaviour.js) ([see demo](https://codepen.io/lekoalabe/pen/wvmBLoB))

## Browser supports

Modern browsers (edge, chrome, firefox, safari... not IE11). [Add a warning if necessary](https://github.com/lekoala/nomodule-browser-warning.js/).

## Also check out

- [Bootstrap5 autocomplete](https://github.com/lekoala/bootstrap5-autocomplete): the autocomplete input for bootstrap 5 (and more!)
- [BS Companion](https://github.com/lekoala/bs-companion): the perfect bootstrap companion
- [Admini](https://github.com/lekoala/admini): the minimalistic bootstrap 5 admin panel

## How to contribute

If you want to make a PR, please make your changes in `tags.js` and do not commit any build files
They will be updated upon release of a new version.

If you want to test your changes, simply run `npm start` and test in `demo.html` (feel free to add new test cases).

For scss updates, apply changes to scss files. They need to be compiled manually since they are not meant to be used by themselves.
