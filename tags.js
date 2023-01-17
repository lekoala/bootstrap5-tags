/**
 * Bootstrap 5 (and 4!) tags
 *
 * Turns your select[multiple] into nice tags lists
 *
 * Required Bootstrap 5 styles:
 * - badge
 * - background-color utility
 * - margin-end utility
 * - float-start utility
 * - forms
 * - dropdown
 */

// #region config

/**
 * @typedef Config
 * @property {Boolean} allowNew Allows creation of new tags
 * @property {Boolean} showAllSuggestions Show all suggestions even if they don't match. Disables validation.
 * @property {String} badgeStyle Color of the badge (color can be configured per option as well)
 * @property {Boolean} allowClear Show a clear icon
 * @property {Boolean} clearEnd Place clear icon at the end
 * @property {Array|String} selected A comma separated list of selected values
 * @property {String} regex Regex for new tags
 * @property {Array|String} separator A list (pipe separated) of characters that should act as separator (default is using enter key)
 * @property {Number} max Limit to a maximum of tags (0 = no limit)
 * @property {String} placeholder Provides a placeholder if none are provided as the first empty option
 * @property {String} clearLabel Text as clear tooltip
 * @property {String} searchLabel Default placeholder
 * @property {Boolean} keepOpen Keep suggestions open after selection, clear on focus out
 * @property {Boolean} allowSame Allow same
 * @property {String} baseClass Customize the class applied to badges
 * @property {Boolean} addOnBlur Add new tags on blur (only if allowNew is enabled)
 * @property {Number} suggestionsThreshold Number of chars required to show suggestions
 * @property {Number} maximumItems Maximum number of items to display
 * @property {Boolean} autoselectFirst Always select the first item
 * @property {Boolean} updateOnSelect Update input value on selection (doesn't play nice with autoselectFirst)
 * @property {Boolean} fullWidth Match the width on the input field
 * @property {Boolean} fixed Use fixed positioning (solve overflow issues)
 * @property {String} labelField Key for the label
 * @property {String} valueField Key for the value
 * @property {String} queryParam Name of the param passed to endpoint (query by default)
 * @property {String} server Endpoint for data provider
 * @property {String|Object} serverParams Parameters to pass along to the server
 * @property {Boolean} liveServer Should the endpoint be called each time on input
 * @property {Boolean} noCache Prevent caching by appending a timestamp
 * @property {Number} debounceTime Debounce time for live server
 * @property {String} notFoundMessage Display a no suggestions found message. Leave empty to disable
 * @property {Function} onRenderItem Callback function that returns the label
 * @property {Function} onSelectItem Callback function to call on selection
 * @property {Function} onClearItem Callback function to call on clear
 * @property {Function} onServerResponse Callback function to process server response. Must return a Promise
 */

/**
 * @type {Config}
 */
const DEFAULTS = {
  allowNew: false,
  showAllSuggestions: false,
  badgeStyle: "primary",
  allowClear: false,
  clearEnd: false,
  selected: [],
  regex: "",
  separator: [],
  max: 0,
  clearLabel: "Clear",
  searchLabel: "Type a value",
  keepOpen: false,
  allowSame: false,
  baseClass: "",
  placeholder: "",
  addOnBlur: false,
  suggestionsThreshold: 1,
  maximumItems: 0,
  autoselectFirst: true,
  updateOnSelect: false,
  fullWidth: false,
  fixed: false,
  labelField: "label",
  valueField: "value",
  queryParam: "query",
  server: "",
  serverParams: {},
  liveServer: false,
  noCache: true,
  debounceTime: 300,
  notFoundMessage: "",
  onRenderItem: (item, label) => {
    return label;
  },
  onSelectItem: (item) => {},
  onClearItem: (value) => {},
  onServerResponse: (response) => {
    return response.json();
  },
};

// #endregion

// #region constants

const CLASS_PREFIX = "tags-";
const LOADING_CLASS = "is-loading";
const ACTIVE_CLASS = "is-active";
const ACTIVE_CLASSES = ["is-active", "bg-primary", "text-white"];
const VALUE_ATTRIBUTE = "data-value";
const NEXT = "next";
const PREV = "prev";
const FOCUS_CLASS = "form-control-focus"; // should match form-control:focus

const INSTANCE_MAP = new WeakMap();
let counter = 0;

// #endregion

// #region functions

/**
 * @param {Function} func
 * @param {number} timeout
 * @returns {Function}
 */
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      //@ts-ignore
      func.apply(this, args);
    }, timeout);
  };
}

/**
 * @param {string} text
 * @param {string} size
 * @returns {Number}
 */
function calcTextWidth(text, size = null) {
  const span = document.createElement("span");
  document.body.appendChild(span);
  span.style.fontSize = size || "inherit";
  span.style.height = "auto";
  span.style.width = "auto";
  span.style.position = "absolute";
  span.style.whiteSpace = "no-wrap";
  span.innerHTML = text;
  const width = Math.ceil(span.clientWidth) + 8;
  document.body.removeChild(span);
  return width;
}

/**
 * @param {String} str
 * @returns {String}
 */
function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * @param {HTMLElement} el
 * @param {HTMLElement} newEl
 * @returns {HTMLElement}
 */
function insertAfter(el, newEl) {
  return el.parentNode.insertBefore(newEl, el.nextSibling);
}

// #endregion

class Tags {
  /**
   * @param {HTMLSelectElement} el
   * @param {Object|Config} config
   */
  constructor(el, config = {}) {
    if (!(el instanceof HTMLElement)) {
      console.error("Invalid element", el);
      return;
    }
    INSTANCE_MAP.set(el, this);
    counter++;
    this._selectElement = el;

    this._configure(config);

    // private vars
    this._keyboardNavigation = false;
    this._searchFunc = debounce(() => {
      this._loadFromServer(true);
    }, this._config.debounceTime);
    this._fireEvents = true;
    this._initialValues = [];

    this._configureParent();

    // Create elements
    this._holderElement = document.createElement("div"); // this is the one holding the fake input and the dropmenu
    this._containerElement = document.createElement("div"); // this is the one for the fake input (labels + input)
    this._holderElement.appendChild(this._containerElement);

    // insert after select
    insertAfter(this._selectElement, this._holderElement);

    // Configure them
    this._configureSelectElement();
    this._configureHolderElement();
    this._configureContainerElement();
    this._configureSearchInput();
    this._configureDropElement();
    this.resetState();

    if (this._config.fixed) {
      document.addEventListener("scroll", this);
      document.addEventListener("resize", this);
    }

    // Add listeners (remove then on dispose()). See handleEvent.
    this._searchInput.addEventListener("focus", this); // focusin bubbles, focus does not.
    this._searchInput.addEventListener("blur", this); // focusout bubbles, blur does not.
    this._searchInput.addEventListener("input", this);
    this._searchInput.addEventListener("keydown", this);
    this._dropElement.addEventListener("mousemove", this);

    this._fetchData();
  }

  // #region Core

  /**
   * Attach to all elements matched by the selector
   * @param {string} selector
   * @param {Object} opts
   */
  static init(selector = "select[multiple]", opts = {}) {
    /**
     * @type {NodeListOf<HTMLSelectElement>}
     */
    let list = document.querySelectorAll(selector);
    for (let i = 0; i < list.length; i++) {
      if (Tags.getInstance(list[i])) {
        continue;
      }
      new Tags(list[i], opts);
    }
  }

  /**
   * @param {HTMLSelectElement} el
   */
  static getInstance(el) {
    if (INSTANCE_MAP.has(el)) {
      return INSTANCE_MAP.get(el);
    }
  }

  dispose() {
    this._searchInput.removeEventListener("focus", this);
    this._searchInput.removeEventListener("blur", this);
    this._searchInput.removeEventListener("input", this);
    this._searchInput.removeEventListener("keydown", this);
    this._dropElement.removeEventListener("mousemove", this);

    if (this._config.fixed) {
      document.removeEventListener("scroll", this);
      document.removeEventListener("resize", this);
    }

    // restore select, remove our custom stuff and unbind parent
    this._selectElement.style.display = "block";
    this._holderElement.parentElement.removeChild(this._holderElement);
    if (this.parentForm) {
      this.parentForm.removeEventListener("reset", this.reset);
    }

    INSTANCE_MAP.delete(this._selectElement);
  }

  /**
   * @link https://gist.github.com/WebReflection/ec9f6687842aa385477c4afca625bbf4#handling-events
   * @param {Event} event
   */
  handleEvent(event) {
    this[`on${event.type}`](event);
  }

  /**
   * @param {Config|Object} config
   */
  _configure(config = {}) {
    this._config = Object.assign({}, DEFAULTS);

    // Handle options, using arguments first and data attr as override
    const o = { ...config, ...this._selectElement.dataset };

    // Allow 1/0, true/false as strings
    const parseBool = (value) => ["true", "false", "1", "0", true, false].includes(value) && !!JSON.parse(value);

    // Typecast provided options based on defaults types
    for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
      // Check for undefined keys
      if (o[key] === void 0) {
        continue;
      }
      const value = o[key];
      switch (typeof defaultValue) {
        case "number":
          this._config[key] = parseInt(value);
          break;
        case "boolean":
          this._config[key] = parseBool(value);
          break;
        case "string":
          this._config[key] = value.toString();
          break;
        case "object":
          // Arrays have a type object in js
          if (Array.isArray(defaultValue)) {
            // string separator can be | or ,
            const separator = value.includes("|") ? "|" : ",";
            this._config[key] = typeof value === "string" ? value.split(separator) : value;
          } else {
            this._config[key] = typeof value === "string" ? JSON.parse(value) : value;
          }
          break;
        case "function":
          this._config[key] = typeof value === "string" ? window[value] : value;
          break;
        default:
          this._config[key] = value;
          break;
      }
    }

    // Dynamic default values
    if (!this._config.placeholder) {
      this._config.placeholder = this._getPlaceholder();
    }
  }

  // #endregion

  // #region Html

  /**
   * Find overflow parent for positioning
   * and bind reset event of the parent form
   */
  _configureParent() {
    this.overflowParent = null;
    this.parentForm = this._selectElement.parentElement;
    while (this.parentForm) {
      if (this.parentForm.style.overflow === "hidden") {
        this.overflowParent = this.parentForm;
      }
      this.parentForm = this.parentForm.parentElement;
      if (this.parentForm && this.parentForm.nodeName == "FORM") {
        break;
      }
    }
    this.reset = this.reset.bind(this);
    if (this.parentForm) {
      this.parentForm.addEventListener("reset", this.reset);
    }
  }

  /**
   * @returns {string}
   */
  _getPlaceholder() {
    // Use placeholder and data-placeholder in priority
    if (this._selectElement.hasAttribute("placeholder")) {
      return this._selectElement.getAttribute("placeholder");
    }
    if (this._selectElement.dataset.placeholder) {
      return this._selectElement.dataset.placeholder;
    }
    // Fallback to first option if no value
    let firstOption = this._selectElement.querySelector("option");
    if (!firstOption) {
      return "";
    }
    if (firstOption.hasAttribute("selected")) {
      firstOption.removeAttribute("selected");
    }
    return !firstOption.value ? firstOption.textContent : "";
  }

  _configureSelectElement() {
    // If we use display none, we don't get the focus event
    // this._selectElement.style.display = "none";
    this._selectElement.style.position = "absolute";
    this._selectElement.style.left = "-9999px";
    this._selectElement.addEventListener("focus", (event) => {
      // Forward event
      this._searchInput.focus();
    });
  }

  /**
   * Configure drop element
   * Needs to be called after searchInput is created
   */
  _configureDropElement() {
    this._dropElement = document.createElement("ul");
    this._dropElement.classList.add(...["dropdown-menu", CLASS_PREFIX + "menu", "p-0"]);
    this._dropElement.setAttribute("id", CLASS_PREFIX + "menu-" + counter);
    this._dropElement.setAttribute("role", "menu");
    this._dropElement.style.maxHeight = "280px";
    if (!this._config.fullWidth) {
      this._dropElement.style.maxWidth = "360px";
    }
    if (this._config.fixed) {
      this._dropElement.style.position = "fixed";
    }
    this._dropElement.style.overflowY = "auto";

    // If the mouse was outside, entering remove keyboard nav mode
    this._dropElement.addEventListener("mouseenter", (event) => {
      this._keyboardNavigation = false;
    });
    this._holderElement.appendChild(this._dropElement);

    // include aria-controls with the value of the id of the suggested list of values.
    this._searchInput.setAttribute("aria-controls", this._dropElement.getAttribute("id"));
  }

  _configureHolderElement() {
    this._holderElement.classList.add(...["form-control", "dropdown"]);
    // Reflect size
    if (this._selectElement.classList.contains("form-select-lg")) {
      this._holderElement.classList.add("form-control-lg");
    }
    if (this._selectElement.classList.contains("form-select-sm")) {
      this._holderElement.classList.add("form-control-sm");
    }
    // If we have an overflow parent, we can simply inherit styles
    if (this.overflowParent) {
      this._holderElement.style.position = "inherit";
    }
    if (this._getBootstrapVersion() === 4) {
      // Prevent fixed height due to form-control
      this._holderElement.style.height = "auto";
    }
  }

  _configureContainerElement() {
    this._containerElement.addEventListener("click", (event) => {
      if (this.isDisabled()) {
        return;
      }
      if (this._searchInput.style.visibility != "hidden") {
        this._searchInput.focus();
      }
    });

    // Add some extra css to help positioning
    this._containerElement.style.display = "flex";
    this._containerElement.style.alignItems = "center";
    this._containerElement.style.flexWrap = "wrap";

    // add initial values
    // we use selectedOptions because single select can have a selected option
    // without a selected attribute if it's the first value
    let initialValues = this._selectElement.selectedOptions ?? [];
    for (let j = 0; j < initialValues.length; j++) {
      let initialValue = initialValues[j];
      if (!initialValue.value) {
        continue;
      }

      // Enforce selected attr for consistency
      initialValue.setAttribute("selected", "selected");

      // track initial values for reset
      this._initialValues.push(initialValue);
      this._createBadge(initialValue.textContent, initialValue.value);
    }
  }

  _configureSearchInput() {
    this._searchInput = document.createElement("input");
    this._searchInput.type = "text";
    this._searchInput.autocomplete = "off";
    this._searchInput.spellcheck = false;
    // @link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-autocomplete
    this._searchInput.ariaAutoComplete = "list";
    // @link https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded
    // use the aria-expanded state on the element with role combobox to communicate that the list is displayed.
    this._searchInput.ariaExpanded = "false";
    this._searchInput.ariaHasPopup = "menu";
    this._searchInput.setAttribute("role", "combobox");
    this._searchInput.ariaLabel = this._config.searchLabel;
    this._searchInput.style.backgroundColor = "transparent";
    this._searchInput.style.color = "currentColor";
    this._searchInput.style.border = "0";
    this._searchInput.style.outline = "0";
    this._searchInput.style.maxWidth = "100%";
    this.resetSearchInput(true);

    this._containerElement.appendChild(this._searchInput);
  }

  // #endregion

  // #region Events

  onfocus(event) {
    this._holderElement.classList.add(FOCUS_CLASS);
    this._showOrSearch();
  }

  onblur(event) {
    // Cancel any pending request
    if (this._abortController) {
      this._abortController.abort();
    }
    this._holderElement.classList.remove(FOCUS_CLASS);
    this._hideSuggestions();
    if (this._config.keepOpen) {
      this.resetSearchInput();
    }

    // Add item on blur
    const sel = this.getSelection();
    const data = {
      selection: sel ? sel.dataset.value : null,
      input: this._searchInput.value,
    };
    if (this._config.addOnBlur) {
      if (this._config.allowNew && this.canAdd(data.input)) {
        this.addItem(data.input);
        this.resetSearchInput();
      }
    }

    if (this._fireEvents) {
      this._selectElement.dispatchEvent(new CustomEvent("tags.blur", { bubbles: true, detail: data }));
    }
  }

  oninput(ev) {
    const data = this._searchInput.value;

    // Add item if a separator is used
    // On mobile or copy paste, it can pass multiple chars (eg: when pressing space and it formats the string)
    if (data) {
      const lastChar = data.slice(-1);
      if (this._config.separator.length && this._config.separator.includes(lastChar)) {
        // Remove separator even if adding is prevented
        this._searchInput.value = this._searchInput.value.slice(0, -1);
        this._add(this._searchInput.value, null);
        return;
      }
    }

    // Adjust input width to current content
    this._adjustWidth();

    // Check if we should display suggestions
    this._showOrSearch();
  }

  /**
   * keypress doesn't send arrow keys, so we use keydown
   * @param {KeyboardEvent} event
   */
  onkeydown(event) {
    // Keycode reference : https://css-tricks.com/snippets/javascript/javascript-keycodes/
    let key = event.keyCode || event.key;
    /**
     * @type {HTMLInputElement}
     */
    // @ts-ignore
    const target = event.target;

    // Android virtual keyboard might always return 229
    if (event.keyCode == 229) {
      key = target.value.charAt(target.selectionStart - 1).charCodeAt(0);
    }

    // Keyboard keys
    switch (key) {
      case 13:
      case "Enter":
        event.preventDefault();
        let selection = this.getSelection();
        if (selection) {
          selection.click();
        } else {
          // We use what is typed if not selected and not empty
          if (this._config.allowNew && this._searchInput.value) {
            let text = this._searchInput.value;
            this._add(text, null);
          }
        }
        break;
      case 38:
      case "ArrowUp":
        event.preventDefault();
        this._keyboardNavigation = true;
        this._moveSelection(PREV);
        break;
      case 40:
      case "ArrowDown":
        event.preventDefault();
        this._keyboardNavigation = true;
        this._moveSelection(NEXT);
        break;
      case 8:
      case "Backspace":
        // If the current item is empty, remove the last one
        if (this._searchInput.value.length == 0) {
          this.removeLastItem();
          this._adjustWidth();
          this._showOrSearch();
        }
        break;
      case 27:
      case "Escape":
        this._searchInput.focus();
        this._hideSuggestions();
        break;
    }
  }

  onmousemove(e) {
    // Moving the mouse means no longer using keyboard
    this._keyboardNavigation = false;
  }

  onscroll(e) {
    this._positionMenu();
  }

  onresize(e) {
    this._positionMenu();
  }

  // #endregion

  resetState() {
    if (this.isDisabled()) {
      this._holderElement.setAttribute("readonly", "");
      this._searchInput.setAttribute("disabled", "");
    } else {
      if (this._holderElement.hasAttribute("readonly")) {
        this._holderElement.removeAttribute("readonly");
      }
      if (this._searchInput.hasAttribute("disabled")) {
        this._searchInput.removeAttribute("disabled");
      }
    }
  }

  resetSuggestions() {
    let suggestions = Array.from(this._selectElement.querySelectorAll("option"))
      .filter((option) => {
        return !option.disabled;
      })
      .map((option) => {
        return {
          value: option.getAttribute("value"),
          label: option.textContent,
        };
      });
    this._buildSuggestions(suggestions);
  }

  /**
   * @param {boolean} show
   */
  _loadFromServer(show = false) {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    const params = Object.assign({}, this._config.serverParams);
    // Pass current value
    params[this._config.queryParam] = this._searchInput.value;
    // Prevent caching
    if (this._config.noCache) {
      params.t = Date.now();
    }
    // We have a related field
    if (params.related) {
      /**
       * @type {HTMLInputElement}
       */
      //@ts-ignore
      const input = document.getElementById(params.related);
      if (input) {
        params.related = input.value;
      }
    }
    const urlParams = new URLSearchParams(params).toString();

    this._holderElement.classList.add(LOADING_CLASS);
    fetch(this._config.server + "?" + urlParams, { signal: this._abortController.signal })
      .then((r) => this._config.onServerResponse(r))
      .then((suggestions) => {
        let data = suggestions.data || suggestions;
        this._buildSuggestions(data);
        this._abortController = null;
        if (show) {
          this._showSuggestions();
        }
      })
      .catch((e) => {
        if (e.name === "AbortError") {
          return;
        }
        console.error(e);
      })
      .finally((e) => {
        this._holderElement.classList.remove(LOADING_CLASS);
      });
  }

  /**
   * @param {string} text
   * @param {string} value
   * @param {object} data
   */
  _add(text, value = null, data = {}) {
    if (!this.canAdd(text, value)) {
      return;
    }
    this.addItem(text, value, data);
    if (this._config.keepOpen) {
      this._showSuggestions();
    } else {
      this.resetSearchInput();
    }
  }

  /**
   * @param {String} dir
   * @returns {HTMLElement}
   */
  _moveSelection(dir = NEXT) {
    const active = this.getSelection();
    /**
     * @type {*|HTMLElement}
     */
    let sel = null;

    // select first li if visible
    if (!active) {
      sel = this._dropElement.firstChild;
      while (sel && sel.style.display === "none") {
        sel = sel["nextSibling"];
      }
    } else {
      const sibling = dir === NEXT ? "nextSibling" : "previousSibling";

      // Iterate over visible li
      sel = active.parentNode;
      do {
        sel = sel[sibling];
      } while (sel && sel.style.display === "none");

      // We have a new selection
      if (sel) {
        // Change classes
        active.classList.remove(...ACTIVE_CLASSES);

        // Scroll if necessary
        if (dir === PREV) {
          // Don't use scrollIntoView as it scrolls the whole window
          sel.parentNode.scrollTop = sel.offsetTop - sel.parentNode.offsetTop;
        } else {
          // This is the equivalent of scrollIntoView(false) but only for parent node
          if (sel.offsetTop > sel.parentNode.offsetHeight - sel.offsetHeight) {
            sel.parentNode.scrollTop += sel.offsetHeight;
          }
        }
      } else if (active) {
        sel = active.parentElement;
      }
    }

    if (sel) {
      const a = sel.querySelector("a");
      a.classList.add(...ACTIVE_CLASSES);
      this._searchInput.setAttribute("aria-activedescendant", a.getAttribute("id"));
      if (this._config.updateOnSelect) {
        this._searchInput.value = a.dataset.label;
        this._adjustWidth();
      }
    } else {
      this._searchInput.setAttribute("aria-activedescendant", "");
    }
    return sel;
  }

  /**
   * Adjust the field to fit its content and show/hide placeholder if needed
   */
  _adjustWidth() {
    if (this._searchInput.value) {
      this._searchInput.size = this._searchInput.value.length;
    } else {
      // Show the placeholder only if empty
      if (this.getSelectedValues().length) {
        this._searchInput.placeholder = "";
        this._searchInput.size = 1;
      } else {
        this._searchInput.size = this._config.placeholder.length > 0 ? this._config.placeholder.length : 1;
        this._searchInput.placeholder = this._config.placeholder;
      }
    }

    // If the string contains ascii chars or strange font, input size may be wrong
    const v = this._searchInput.value || this._searchInput.placeholder;
    const computedFontSize = window.getComputedStyle(this._holderElement).fontSize;
    const w = calcTextWidth(v, computedFontSize);
    this._searchInput.style.minWidth = w + "px";
  }

  /**
   * Add suggestions to the drop element
   * @param {array} suggestions
   */
  _buildSuggestions(suggestions) {
    while (this._dropElement.lastChild) {
      this._dropElement.removeChild(this._dropElement.lastChild);
    }
    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      if (!suggestion[this._config.valueField]) {
        continue;
      }

      const value = suggestion[this._config.valueField];
      const label = suggestion[this._config.labelField];

      // initial selection from remote data
      if (!this._config.liveServer) {
        if (suggestion.selected || this._config.selected.includes(value)) {
          // track for reset
          this._initialValues.push({
            value: value,
            textContent: label,
            dataset: suggestion.data,
          });
          this._add(label, value, suggestion.data);
          continue; // no need to add as suggestion
        }
      }

      const textContent = this._config.onRenderItem(suggestion, label);

      const newChild = document.createElement("li");
      newChild.setAttribute("role", "presentation");
      const newChildLink = document.createElement("a");
      newChild.append(newChildLink);
      newChildLink.setAttribute("id", this._dropElement.getAttribute("id") + "-" + i);
      newChildLink.classList.add(...["dropdown-item", "text-truncate"]);
      newChildLink.setAttribute(VALUE_ATTRIBUTE, value);
      newChildLink.setAttribute("data-label", label);
      newChildLink.setAttribute("href", "#");
      newChildLink.textContent = textContent;
      this._dropElement.appendChild(newChild);

      // Hover sets active item
      newChildLink.addEventListener("mouseenter", (event) => {
        // Don't trigger enter if using arrows
        if (this._keyboardNavigation) {
          return;
        }
        this.removeSelection();
        newChild.querySelector("a").classList.add(...ACTIVE_CLASSES);
      });
      newChildLink.addEventListener("mousedown", (event) => {
        // Otherwise searchInput would lose focus and close the menu
        event.preventDefault();
      });
      newChildLink.addEventListener("click", (event) => {
        event.preventDefault();
        this._add(textContent, value, suggestion.data);
        this._config.onSelectItem(suggestion);
      });
    }

    // Create the not found message
    if (this._config.notFoundMessage) {
      const notFound = document.createElement("li");
      notFound.setAttribute("role", "presentation");
      notFound.classList.add(CLASS_PREFIX + "not-found");
      notFound.innerHTML = `<span class="dropdown-item">${this._config.notFoundMessage}</span>`;
      this._dropElement.appendChild(notFound);
    }
  }

  reset() {
    this.removeAll();

    // Reset doesn't fire change event
    this._fireEvents = false;
    for (let j = 0; j < this._initialValues.length; j++) {
      const iv = this._initialValues[j];
      this.addItem(iv.textContent, iv.value, iv.dataset);
    }
    this._adjustWidth();
    this._fireEvents = true;
  }

  /**
   * @param {Boolean} init Pass true during init
   */
  resetSearchInput(init = false) {
    this._searchInput.value = "";
    this._adjustWidth();

    if (!init) {
      this._hideSuggestions();
      // Trigger input even to show suggestions if needed when focused
      if (this._searchInput === document.activeElement) {
        this._searchInput.dispatchEvent(new Event("input"));
      }
    }

    // We use visibility instead of display to keep layout intact
    if (this._config.max && this.getSelectedValues().length >= this._config.max) {
      this._searchInput.style.visibility = "hidden";
    } else if (this._searchInput.style.visibility == "hidden") {
      this._searchInput.style.visibility = "visible";
    }

    if (this.isSingle() && !init) {
      //@ts-ignore
      document.activeElement.blur();
    }
  }

  /**
   * @returns {array}
   */
  getSelectedValues() {
    // option[selected] is used rather that selectedOptions as it works more consistently
    /**
     * @type {NodeListOf<HTMLOptionElement>}
     */
    const selected = this._selectElement.querySelectorAll("option[selected]");
    return Array.from(selected).map((el) => el.value);
  }

  /**
   * Do we have enough input to show suggestions ?
   * @returns {Boolean}
   */
  _shouldShow() {
    if (this.isDisabled()) {
      return false;
    }
    return this._searchInput.value.length >= this._config.suggestionsThreshold;
  }

  /**
   * Show suggestions or search them depending on live server
   */
  _showOrSearch() {
    if (!this._shouldShow()) {
      this._hideSuggestions();
      return;
    }
    if (this._config.liveServer) {
      this._searchFunc();
    } else {
      this._showSuggestions();
    }
  }

  /**
   * The element create with buildSuggestions
   */
  _showSuggestions() {
    if (this._searchInput.style.visibility == "hidden") {
      return;
    }

    const lookup = removeDiacritics(this._searchInput.value).toLowerCase();

    // Get current values
    const values = this.getSelectedValues();

    // Filter the list according to search string
    const list = this._dropElement.querySelectorAll("li");
    let count = 0;
    let firstItem = null;
    let hasPossibleValues = false;
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      let link = item.querySelector("a");

      // This is the empty result message
      if (!link) {
        item.style.display = "none";
        continue;
      }

      // Remove previous selection
      link.classList.remove(...ACTIVE_CLASSES);

      // Hide selected values
      if (!this._config.allowSame && values.indexOf(link.getAttribute(VALUE_ATTRIBUTE)) != -1) {
        item.style.display = "none";
        continue;
      }

      hasPossibleValues = true;

      // Check search length since we can trigger dropdown with arrow
      const text = removeDiacritics(item.textContent).toLowerCase();
      const isMatched = lookup.length > 0 ? text.indexOf(lookup) >= 0 : true;
      if (this._config.showAllSuggestions || isMatched) {
        count++;
        item.style.display = "list-item";
        if (!firstItem && isMatched) {
          firstItem = item;
        }
        if (this._config.maximumItems > 0 && count > this._config.maximumItems) {
          item.style.display = "none";
        }
      } else {
        item.style.display = "none";
      }
    }

    if (firstItem || this._config.showAllSuggestions) {
      this._holderElement.classList.remove("is-invalid");

      if (firstItem && this._config.autoselectFirst) {
        this._moveSelection(NEXT);
      }
    } else {
      // No item and we don't allow new items => error
      if (!this._config.allowNew && !(lookup.length === 0 && !hasPossibleValues)) {
        this._holderElement.classList.add("is-invalid");
      } else if (this._config.regex && this.isInvalid()) {
        this._holderElement.classList.remove("is-invalid");
      }
    }

    // Remove dropdown if not found or to show validation message
    if (count === 0 || this.isInvalid()) {
      if (this._config.notFoundMessage) {
        /**
         * @type {HTMLElement}
         */
        const notFound = this._dropElement.querySelector("." + CLASS_PREFIX + "not-found");
        notFound.style.display = "block";
      } else {
        // Remove dropdown if not found
        this._hideSuggestions();
      }
    } else {
      // Or show it if necessary
      this._dropElement.classList.add("show");
      this._searchInput.ariaExpanded = "true";
      this._positionMenu();
    }
  }

  /**
   * Checks if parent is fixed for boundary checks
   * @returns {Boolean}
   */
  _hasFixedPosition() {
    if (this._config.fixed) {
      return true;
    }
    let parent = this._holderElement.parentElement;
    while (parent && parent instanceof HTMLElement) {
      if (parent.style.position === "fixed") {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  _positionMenu() {
    const bounds = this._searchInput.getBoundingClientRect();
    const fixedParent = this._hasFixedPosition();

    if (this._config.fullWidth) {
      // Use full input width
      this._dropElement.style.left = -1 + "px";
      this._dropElement.style.width = this._holderElement.offsetWidth + "px";
    } else {
      // Position next to search input
      let left = this._config.fixed ? bounds.x : this._searchInput.offsetLeft;

      // Overflow right
      const w = fixedParent ? window.innerWidth : document.body.offsetWidth;
      const wdiff = w - 1 - (bounds.x + this._dropElement.offsetWidth);

      // If the dropdowns goes out of the viewport, remove the diff from the left position
      if (wdiff < 0) {
        left += wdiff;
      }
      this._dropElement.style.left = left + "px";
    }

    if (this._config.fixed) {
      // Remove scroll position
      this._dropElement.style.transform = "translateY(calc(-" + window.pageYOffset + "px))";
    } else {
      // Overflow bottom
      const h = fixedParent ? window.innerHeight : document.body.offsetHeight;
      const bottom = bounds.y + window.pageYOffset + this._dropElement.offsetHeight;

      const hdiff = h - bottom;
      if (hdiff < 0 && h > bounds.height) {
        // We display above input
        this._dropElement.style.transform = "translateY(calc(-100% - " + this._searchInput.offsetHeight + "px))";
      } else {
        this._dropElement.style.transform = "none";
      }
    }
  }

  /**
   * The element create with buildSuggestions
   */
  _hideSuggestions() {
    this._dropElement.classList.remove("show");
    this._holderElement.classList.remove("is-invalid");
    this._searchInput.ariaExpanded = "false";
    this.removeSelection();
  }

  /**
   * @returns {Number}
   */
  _getBootstrapVersion() {
    let ver = 5;
    // If we have jQuery and the tooltip plugin for BS4
    //@ts-ignore
    if (window.jQuery && $.fn.tooltip != undefined && $.fn.tooltip.Constructor != undefined) {
      //@ts-ignore
      ver = parseInt($.fn.tooltip.Constructor.VERSION.charAt(0));
    }
    return ver;
  }

  /**
   * Find if label is already selected (based on attribute)
   * @param {string} text
   * @returns {boolean}
   */
  _isSelected(text) {
    const opt = Array.from(this._selectElement.querySelectorAll("option")).find((el) => el.textContent == text);
    if (opt && opt.getAttribute("selected")) {
      return true;
    }
    return false;
  }

  _fetchData() {
    if (this._config.server && !this._config.liveServer) {
      this._loadFromServer();
    } else {
      this.resetSuggestions();
    }
  }

  /**
   * Checks if value matches a configured regex
   * @param {string} value
   * @returns {boolean}
   */
  _validateRegex(value) {
    const regex = new RegExp(this._config.regex.trim());
    return regex.test(value);
  }

  /**
   * @returns {HTMLElement}
   */
  getSelection() {
    return this._dropElement.querySelector("a." + ACTIVE_CLASS);
  }

  removeSelection() {
    const selection = this.getSelection();
    if (selection) {
      selection.classList.remove(...ACTIVE_CLASSES);
    }
  }

  /**
   * @deprecated since 1.5
   * @returns {HTMLElement}
   */
  getActiveSelection() {
    return this.getSelection();
  }

  /**
   * @deprecated since 1.5
   */
  removeActiveSelection() {
    return this.removeSelection();
  }

  removeAll() {
    let items = this.getSelectedValues();
    items.forEach((item) => {
      this.removeItem(item, true);
    });
    this._adjustWidth();
  }

  /**
   * @param {boolean} noEvents
   */
  removeLastItem(noEvents = false) {
    let items = this._containerElement.querySelectorAll("span");
    if (!items.length) {
      return;
    }
    let lastItem = items[items.length - 1];
    this.removeItem(lastItem.getAttribute(VALUE_ATTRIBUTE), noEvents);
    if (!noEvents) {
      this._config.onClearItem(lastItem.getAttribute(VALUE_ATTRIBUTE));
    }
  }

  /**
   * @returns {boolean}
   */
  isDisabled() {
    return this._selectElement.hasAttribute("disabled") || this._selectElement.disabled || this._selectElement.hasAttribute("readonly");
  }

  /**
   * @returns {boolean}
   */
  isDropdownVisible() {
    return this._dropElement.classList.contains("show");
  }

  /**
   * @returns {boolean}
   */
  isInvalid() {
    return this._holderElement.classList.contains("is-invalid");
  }

  /**
   * @returns {boolean}
   */
  isSingle() {
    return !this._selectElement.hasAttribute("multiple");
  }

  /**
   * @param {string} text
   * @param {string} value
   * @returns {boolean}
   */
  canAdd(text, value = null) {
    if (!value) {
      value = text;
    }
    // Check invalid input
    if (!text) {
      return false;
    }
    // Check disabled
    if (this.isDisabled()) {
      return false;
    }
    // Check already selected input (single will replace)
    if (!this.isSingle() && !this._config.allowSame && this._isSelected(text)) {
      return false;
    }
    // Check for max
    if (this._config.max && this.getSelectedValues().length >= this._config.max) {
      return false;
    }
    // Check for regex
    if (this._config.regex && !this._validateRegex(text)) {
      this._holderElement.classList.add("is-invalid");
      return false;
    }
    return true;
  }

  /**
   * You might want to use canAdd before to ensure the item is valid
   * @param {string} text
   * @param {string} value
   * @param {object} data
   */
  addItem(text, value = null, data = {}) {
    if (!value) {
      value = text;
    }

    // Single items remove first
    if (this.isSingle() && this.getSelectedValues().length) {
      this.removeLastItem(true);
    }

    let opts = this._selectElement.querySelectorAll('option[value="' + value + '"]');
    /**
     * @type {HTMLOptionElement}
     */
    let opt = null;
    if (this._config.allowSame) {
      // Match same items by content
      opts.forEach(
        /**
         * @param {HTMLOptionElement} o
         */ (o) => {
          if (o.textContent === text && !o.selected) {
            opt = o;
          }
        }
      );
    } else {
      //@ts-ignore
      opt = opts[0] ?? null;
    }

    // we need to create a new option
    if (!opt) {
      opt = document.createElement("option");
      opt.value = value;
      opt.textContent = text; // innerText is not well supported by jsdom
      // Pass along data provided
      for (const [key, value] of Object.entries(data)) {
        opt.dataset[key] = value;
      }
      this._selectElement.appendChild(opt);
    }

    if (opt) {
      data = Object.assign({}, data, opt.dataset);
    }

    // update select, we need to set attribute for option[selected]
    opt.setAttribute("selected", "selected");
    opt.selected = true;

    this._createBadge(text, value, data);

    // Fire change event
    if (this._fireEvents) {
      this._selectElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  /**
   * @param {string} text
   * @param {string} value
   * @param {object} data
   */
  _createBadge(text, value = null, data = {}) {
    const bver = this._getBootstrapVersion();

    // create span
    let html = text;
    let span = document.createElement("span");
    let classes = ["badge"];
    let badgeStyle = this._config.badgeStyle;
    if (data.badgeStyle) {
      badgeStyle = data.badgeStyle;
    }
    if (data.badgeClass) {
      classes.push(...data.badgeClass.split(" "));
    }
    if (this._config.baseClass) {
      // custom style
      bver === 5 ? classes.push("me-2") : classes.push("mr-2");
      classes.push(...this._config.baseClass.split(" "));
    } else if (bver === 5) {
      // https://getbootstrap.com/docs/5.3/components/badge/
      // add extra classes to avoid any layout issues due to very large labels
      classes = [...classes, ...["me-2", "my-1", "bg-" + badgeStyle, "mw-100", "overflow-x-hidden"]];
    } else {
      // https://getbootstrap.com/docs/4.6/components/badge/
      classes = [...classes, ...["mr-2", "my-1", "badge-" + badgeStyle]];
    }
    span.classList.add(...classes);
    span.setAttribute(VALUE_ATTRIBUTE, value);

    if (this._config.allowClear) {
      const closeClass = classes.includes("text-dark") ? "btn-close" : "btn-close-white";
      let btnMargin;
      let btnFloat;
      if (this._config.clearEnd) {
        btnMargin = bver === 5 ? "ms-2" : "ml-2";
        btnFloat = bver === 5 ? "float-end" : "float:right;";
      } else {
        btnMargin = bver === 5 ? "me-2" : "mr-2";
        btnFloat = bver === 5 ? "float-start" : "float:left;";
      }
      const btn =
        bver === 5
          ? '<button type="button" style="font-size:0.65em" class="' +
            btnMargin +
            " " +
            btnFloat +
            " btn-close " +
            closeClass +
            '" aria-label="' +
            this._config.clearLabel +
            '"></button>'
          : '<button type="button" style="font-size:1em;' +
            btnFloat +
            'text-shadow:none;color:currentColor;transform:scale(1.2)" class="' +
            btnMargin +
            ' close" aria-label="' +
            this._config.clearLabel +
            '"><span aria-hidden="true">&times;</span></button>';
      html = btn + html;
    }

    span.innerHTML = html;
    this._containerElement.insertBefore(span, this._searchInput);

    if (this._config.allowClear) {
      span.querySelector("button").addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!this.isDisabled()) {
          this.removeItem(value);
          this._config.onClearItem(value);
          //@ts-ignore
          document.activeElement.blur();
          this._adjustWidth();
        }
      });
    }
  }

  /**
   * @param {string} value
   * @param {boolean} value
   */
  removeItem(value, noEvents = false) {
    let item = this._containerElement.querySelector("span[" + VALUE_ATTRIBUTE + '="' + value + '"]');
    if (!item) {
      return;
    }
    item.remove();

    // update select
    /**
     * @type {HTMLOptionElement}
     */
    let opt = this._selectElement.querySelector('option[value="' + value + '"][selected]');
    if (opt) {
      opt.removeAttribute("selected");
      opt.selected = false;

      // Fire change event
      if (this._fireEvents && !noEvents) {
        this._selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Make input visible
    if (this._searchInput.style.visibility == "hidden" && this._config.max && this.getSelectedValues().length < this._config.max) {
      this._searchInput.style.visibility = "visible";
    }
  }
}

export default Tags;
