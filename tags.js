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

const ACTIVE_CLASS = "is-active";
const ACTIVE_CLASSES = ["is-active", "bg-primary", "text-white"];
const VALUE_ATTRIBUTE = "data-value";

// Static map will minify very badly as class prop, so we use an external constant
const INSTANCE_MAP = new WeakMap();

class Tags {
  /**
   * @param {HTMLSelectElement} el
   * @param {Object} globalOpts
   */
  constructor(el, globalOpts = {}) {
    // Hide the select element and register a tags attr
    el.style.display = "none";
    INSTANCE_MAP.set(el, this);
    this._selectElement = el;

    // Allow 1/0, true/false as strings
    const parseBool = (value) => ["true", "false", "1", "0", true, false].includes(value) && !!JSON.parse(value);

    // Handle options, using global settings first and data attr override
    const opts = { ...globalOpts, ...el.dataset };
    this.allowNew = opts.allowNew ? parseBool(opts.allowNew) : false;
    this.showAllSuggestions = opts.showAllSuggestions ? parseBool(opts.showAllSuggestions) : false;
    this.badgeStyle = opts.badgeStyle || "primary";
    this.allowClear = opts.allowClear ? parseBool(opts.allowClear) : false;
    this.server = opts.server || false;
    this.liveServer = opts.liveServer ? parseBool(opts.liveServer) : false;
    this.serverParams = opts.serverParams || {};
    if (typeof this.serverParams == "string") {
      this.serverParams = JSON.parse(this.serverParams);
    }
    this.selected = opts.selected ? opts.selected.split(",") : [];
    this.suggestionsThreshold = typeof opts.suggestionsThreshold != "undefined" ? parseInt(opts.suggestionsThreshold) : 1;
    this.validationRegex = opts.regex || "";
    this.separator = opts.separator ? opts.separator.split("|") : [];
    this.max = opts.max ? parseInt(opts.max) : null;
    this.clearLabel = opts.clearLabel || "Clear";
    this.searchLabel = opts.searchLabel || "Type a value";
    this.valueField = opts.valueField || "value";
    this.labelField = opts.labelField || "label";
    this.keepOpen = opts.keepOpen ? parseBool(opts.keepOpen) : false;
    this.fullWidth = opts.fullWidth ? parseBool(opts.fullWidth) : false;
    this.debounceTime = opts.debounceTime ? parseInt(opts.debounceTime) : 300;

    this.placeholder = opts.placeholder || this._getPlaceholder();
    this._keyboardNavigation = false;
    this._fireEvents = true;
    this._searchFunc = Tags.debounce(() => {
      this._loadFromServer(true);
    }, this.debounceTime);

    this.overflowParent = null;
    this.parentForm = el.parentElement;
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

    // Create elements
    this._holderElement = document.createElement("div"); // this is the one holding the fake input and the dropmenu
    this._containerElement = document.createElement("div"); // this is the one for the fake input (labels + input)
    this._dropElement = document.createElement("ul");
    this._searchInput = document.createElement("input");

    this._holderElement.appendChild(this._containerElement);
    this._containerElement.appendChild(this._searchInput);
    this._holderElement.appendChild(this._dropElement);
    // insert after select
    this._selectElement.parentNode.insertBefore(this._holderElement, this._selectElement.nextSibling);

    // Configure them
    this._configureHolderElement();
    this._configureDropElement();
    this._configureContainerElement();
    this._configureSearchInput();
    this.resetState();

    if (this.server && !this.liveServer) {
      this._loadFromServer();
    } else {
      this.resetSuggestions();
    }
  }

  /**
   * Attach to all elements matched by the selector
   * @param {string} selector
   * @param {Object} opts
   */
  static init(selector = "select[multiple]", opts = {}) {
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

  /**
   * @param {Function} func
   * @param {number} timeout
   * @returns {Function}
   */
  static debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  dispose() {
    INSTANCE_MAP.delete(this._selectElement);
    this._selectElement.style.display = "block";
    this._holderElement.parentNode.removeChild(this._holderElement);
    if (this.parentForm) {
      this.parentForm.removeEventListener("reset", this.reset);
    }
  }

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

    this.serverParams.query = this._searchInput.value;
    const params = new URLSearchParams(this.serverParams).toString();

    fetch(this.server + "?" + params, { signal: this._abortController.signal })
      .then((r) => r.json())
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
      });
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

  _configureDropElement() {
    this._dropElement.classList.add(...["dropdown-menu", "p-0"]);
    this._dropElement.style.maxHeight = "280px";
    if (!this.fullWidth) {
      this._dropElement.style.maxWidth = "360px";
    }
    this._dropElement.style.overflowY = "auto";

    // If the mouse was outside, entering remove keyboard nav mode
    this._dropElement.addEventListener("mouseenter", (event) => {
      this._keyboardNavigation = false;
    });
  }

  _configureHolderElement() {
    this._holderElement.classList.add(...["form-control", "dropdown"]);
    if (this._selectElement.classList.contains("form-select-lg")) {
      this._holderElement.classList.add("form-control-lg");
    }
    if (this._selectElement.classList.contains("form-select-sm")) {
      this._holderElement.classList.add("form-control-sm");
    }
    // If we don't have an overflow parent, we can simply inherit styles
    // If we have an overflow parent, it needs a relatively positioned element
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

    // add initial values
    // we use selectedOptions because single select can have a selected option
    // without a selected attribute if it's the first value
    let initialValues = this._selectElement.selectedOptions;
    for (let j = 0; j < initialValues.length; j++) {
      let initialValue = initialValues[j];
      if (!initialValue.value) {
        continue;
      }
      // track initial values for reset
      initialValue.dataset.init = 1;
      this.addItem(initialValue.textContent, initialValue.value);
    }
  }

  _configureSearchInput() {
    this._searchInput.type = "text";
    this._searchInput.autocomplete = "off";
    this._searchInput.spellcheck = false;
    this._searchInput.style.backgroundColor = "transparent";
    this._searchInput.style.border = 0;
    this._searchInput.style.outline = 0;
    this._searchInput.style.maxWidth = "100%";
    this._searchInput.ariaLabel = this.searchLabel;
    this._resetSearchInput(true);

    this._searchInput.addEventListener("input", (event) => {
      // Add item if a separator is used
      // On mobile or copy paste, it can pass multiple chars (eg: when pressing space and it formats the string)
      if (event.data) {
        const lastChar = event.data.slice(-1);
        if (this.separator.length && this._searchInput.value && this.separator.includes(lastChar)) {
          // Remove separator even if adding is prevented
          this._searchInput.value = this._searchInput.value.slice(0, -1);
          let text = this._searchInput.value;
          this._add(text, null);
          return;
        }
      }

      // Adjust input width to current content
      this._adjustWidth();

      // Check if we should display suggestions
      if (this._searchInput.value.length >= this.suggestionsThreshold) {
        if (this.liveServer) {
          this._searchFunc();
        } else {
          this._showSuggestions();
        }
      } else {
        this._hideSuggestions();
      }
    });
    this._searchInput.addEventListener("focus", (event) => {
      if (this._searchInput.value.length >= this.suggestionsThreshold) {
        this._showSuggestions();
      }
    });
    this._searchInput.addEventListener("focusout", (event) => {
      this._hideSuggestions();
      if (this.keepOpen) {
        this._resetSearchInput();
      }
    });
    // keypress doesn't send arrow keys, so we use keydown
    this._searchInput.addEventListener("keydown", (event) => {
      // Keycode reference : https://css-tricks.com/snippets/javascript/javascript-keycodes/
      let key = event.keyCode || event.key;

      // Keyboard keys
      switch (key) {
        case 13:
        case "Enter":
          event.preventDefault();
          let selection = this.getActiveSelection();
          if (selection) {
            selection.click();
          } else {
            // We use what is typed if not selected and not empty
            if (this.allowNew && this._searchInput.value) {
              let text = this._searchInput.value;
              this._add(text, null);
            }
          }
          break;
        case 38:
        case "ArrowUp":
          event.preventDefault();
          this._keyboardNavigation = true;
          let newSelection = this._moveSelectionUp();
          // If we use arrow up without input and there is no new selection, hide suggestions
          if (this._searchInput.value.length == 0 && this._dropElement.classList.contains("show") && !newSelection) {
            this._hideSuggestions();
          }
          break;
        case 40:
        case "ArrowDown":
          event.preventDefault();
          this._keyboardNavigation = true;
          this._moveSelectionDown();
          // If we use arrow down without input, show suggestions
          if (this._searchInput.value.length == 0 && !this._dropElement.classList.contains("show")) {
            this._showSuggestions();
          }
          break;
        case 8:
        case "Backspace":
          if (this._searchInput.value.length == 0) {
            this.removeLastItem();
            this._adjustWidth();
            this._hideSuggestions();
          }
          break;
        case 27:
        case "Escape":
          // We may wish to not use the suggestions
          this._hideSuggestions();
          break;
      }
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
    if (this.keepOpen) {
      this._showSuggestions();
    } else {
      this._resetSearchInput();
    }
  }

  /**
   * @returns {HTMLElement}
   */
  _moveSelectionUp() {
    let active = this.getActiveSelection();
    if (active) {
      let prev = active.parentNode;
      do {
        prev = prev.previousSibling;
      } while (prev && prev.style.display == "none");
      if (!prev) {
        return null;
      }
      active.classList.remove(...ACTIVE_CLASSES);
      prev.querySelector("a").classList.add(...ACTIVE_CLASSES);
      // Don't use scrollIntoView as it scrolls the whole window
      prev.parentNode.scrollTop = prev.offsetTop - prev.parentNode.offsetTop;
      return prev;
    }
    return null;
  }

  /**
   * @returns {HTMLElement}
   */
  _moveSelectionDown() {
    let active = this.getActiveSelection();
    let next = null;
    if (active) {
      next = active.parentNode;
      do {
        next = next.nextSibling;
      } while (next && next.style.display == "none");
      if (!next) {
        return null;
      }
      active.classList.remove(...ACTIVE_CLASSES);
      next.querySelector("a").classList.add(...ACTIVE_CLASSES);
      // This is the equivalent of scrollIntoView(false) but only for parent node
      if (next.offsetTop > next.parentNode.offsetHeight - next.offsetHeight) {
        next.parentNode.scrollTop += next.offsetHeight;
      }
      return next;
    }
    return next;
  }

  /**
   * @param {string} text
   * @param {string} size
   * @returns {Number}
   */
  _calcTextWidth(text, size = null) {
    var span = document.createElement("span");
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
        this._searchInput.size = this.placeholder.length > 0 ? this.placeholder.length : 1;
        this._searchInput.placeholder = this.placeholder;
      }
    }

    // If the string contains ascii chars or strange font, input size may be wrong
    const v = this._searchInput.value || this._searchInput.placeholder;
    const computedFontSize = window.getComputedStyle(this._holderElement).fontSize;
    const w = this._calcTextWidth(v, computedFontSize);
    this._searchInput.style.minWidth = w + "px";
  }

  /**
   * Add suggestions to the drop element
   * @param {array} suggestions
   */
  _buildSuggestions(suggestions = null) {
    while (this._dropElement.lastChild) {
      this._dropElement.removeChild(this._dropElement.lastChild);
    }
    for (let i = 0; i < suggestions.length; i++) {
      let suggestion = suggestions[i];
      if (!suggestion[this.valueField]) {
        continue;
      }

      // initial selection
      if (suggestion.selected || this.selected.includes(suggestion[this.valueField])) {
        this._add(suggestion[this.labelField], suggestion[this.valueField], suggestion.data);
        continue; // no need to add as suggestion
      }

      let newChild = document.createElement("li");
      let newChildLink = document.createElement("a");
      newChild.append(newChildLink);
      newChildLink.classList.add(...["dropdown-item", "text-truncate"]);
      newChildLink.setAttribute(VALUE_ATTRIBUTE, suggestion[this.valueField]);
      newChildLink.setAttribute("href", "#");
      newChildLink.textContent = suggestion[this.labelField];
      if (suggestion.data) {
        for (const [key, value] of Object.entries(suggestion.data)) {
          newChildLink.dataset[key] = value;
        }
      }
      this._dropElement.appendChild(newChild);

      // Hover sets active item
      newChildLink.addEventListener("mouseenter", (event) => {
        // Don't trigger enter if using arrows
        if (this._keyboardNavigation) {
          return;
        }
        this.removeActiveSelection();
        newChild.querySelector("a").classList.add(...ACTIVE_CLASSES);
      });
      // Moving the mouse means no longer using keyboard
      newChildLink.addEventListener("mousemove", (event) => {
        this._keyboardNavigation = false;
      });

      newChildLink.addEventListener("mousedown", (event) => {
        // Otherwise searchInput would lose focus and close the menu
        event.preventDefault();
      });
      newChildLink.addEventListener("click", (event) => {
        event.preventDefault();
        this._add(newChildLink.textContent, newChildLink.getAttribute(VALUE_ATTRIBUTE), newChildLink.dataset);
      });
    }
  }

  reset() {
    this.removeAll();

    // Reset doesn't fire change event
    this._fireEvents = false;
    let initialValues = this._selectElement.querySelectorAll("option[data-init]");
    for (let j = 0; j < initialValues.length; j++) {
      let initialValue = initialValues[j];
      this.addItem(initialValue.textContent, initialValue.value);
    }
    this._adjustWidth();
    this._fireEvents = true;
  }

  /**
   * @param {bool} init Pass true during init
   */
  _resetSearchInput(init = false) {
    this._searchInput.value = "";
    this._adjustWidth();

    if (!init) {
      this._hideSuggestions();
      // Trigger input even to show suggestions if needed
      this._searchInput.dispatchEvent(new Event("input"));
    }

    // We use visibility instead of display to keep layout intact
    if (this.max && this.getSelectedValues().length >= this.max) {
      this._searchInput.style.visibility = "hidden";
    } else if (this._searchInput.style.visibility == "hidden") {
      this._searchInput.style.visibility = "visible";
    }

    if (this.isSingle() && !init) {
      document.activeElement.blur();
    }
  }

  /**
   * @returns {array}
   */
  getSelectedValues() {
    // option[selected] is used rather that selectedOptions as it works more consistently
    let selected = this._selectElement.querySelectorAll("option[selected]");
    return Array.from(selected).map((el) => el.value);
  }

  /**
   * The element create with buildSuggestions
   */
  _showSuggestions() {
    if (this._searchInput.style.visibility == "hidden") {
      return;
    }

    // Get search value
    let search = this._searchInput.value.toLocaleLowerCase();

    // Get current values
    let values = this.getSelectedValues();

    // Filter the list according to search string
    let list = this._dropElement.querySelectorAll("li");
    let found = false;
    let firstItem = null;
    let hasPossibleValues = false;
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      let text = item.textContent.toLocaleLowerCase();
      let link = item.querySelector("a");

      // Remove previous selection
      link.classList.remove(...ACTIVE_CLASSES);

      // Hide selected values
      if (values.indexOf(link.getAttribute(VALUE_ATTRIBUTE)) != -1) {
        item.style.display = "none";
        continue;
      }

      hasPossibleValues = true;

      // Check search length since we can trigger dropdown with arrow
      let isMatched = search.length === 0 || text.indexOf(search) !== -1;
      if (this.showAllSuggestions || this.suggestionsThreshold === 0 || isMatched) {
        item.style.display = "list-item";
        found = true;
        if (!firstItem && isMatched) {
          firstItem = item;
        }
      } else {
        item.style.display = "none";
      }
    }

    // Always select first item
    if (firstItem) {
      this._holderElement.classList.remove("is-invalid");
      firstItem.querySelector("a").classList.add(...ACTIVE_CLASSES);
      firstItem.parentNode.scrollTop = firstItem.offsetTop;
    } else {
      // No item and we don't allow new items => error
      if (!this.allowNew && !(search.length === 0 && !hasPossibleValues)) {
        this._holderElement.classList.add("is-invalid");
      } else if (this.validationRegex && this.isInvalid()) {
        this._holderElement.classList.remove("is-invalid");
      }
    }

    // Remove dropdown if not found or to show validation message
    if (!found || this.isInvalid()) {
      this._dropElement.classList.remove("show");
    } else {
      // Or show it if necessary
      this._dropElement.classList.add("show");

      if (this.fullWidth) {
        // Use full input width
        this._dropElement.style.left = -1 + "px";
        this._dropElement.style.width = this._holderElement.offsetWidth + "px";
      } else {
        // Position next to search input
        let left = this._searchInput.offsetLeft;

        // Overflow right
        const w = document.body.offsetWidth - 1; // avoid rounding issues
        const scrollbarOffset = 30; // scrollbars are not taken into account
        const wdiff = w - (left + this._dropElement.offsetWidth) - scrollbarOffset;

        // If the dropdowns goes out of the viewport, remove the diff from the left position
        if (wdiff < 0) {
          left = left + wdiff;
        }
        this._dropElement.style.left = left + "px";

        // Overflow bottom
        const h = document.body.offsetHeight;
        let bottom = this._searchInput.getBoundingClientRect().y + window.pageYOffset + this._dropElement.offsetHeight;
        const hdiff = h - bottom;
        if (hdiff < 0) {
          // We display above input
          this._dropElement.style.transform = "translateY(calc(-100% - " + scrollbarOffset + "px))";
        } else {
          this._dropElement.style.transform = "none";
        }
      }
    }
  }

  /**
   * The element create with buildSuggestions
   */
  _hideSuggestions() {
    this._dropElement.classList.remove("show");
    this._holderElement.classList.remove("is-invalid");
    this.removeActiveSelection();
  }

  /**
   * @returns {Number}
   */
  _getBootstrapVersion() {
    let ver = 5;
    // If we have jQuery and the tooltip plugin for BS4
    if (window.jQuery && $.fn.tooltip != undefined && $.fn.tooltip.Constructor != undefined) {
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

  /**
   * Checks if value matches a configured regex
   * @param {string} value
   * @returns {boolean}
   */
  _validateRegex(value) {
    const regex = new RegExp(this.validationRegex.trim());
    return regex.test(value);
  }

  /**
   * @returns {HTMLElement}
   */
  getActiveSelection() {
    return this._dropElement.querySelector("a." + ACTIVE_CLASS);
  }

  removeActiveSelection() {
    let selection = this.getActiveSelection();
    if (selection) {
      selection.classList.remove(...ACTIVE_CLASSES);
    }
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
  removeLastItem(noEvents) {
    let items = this._containerElement.querySelectorAll("span");
    if (!items.length) {
      return;
    }
    let lastItem = items[items.length - 1];
    this.removeItem(lastItem.getAttribute(VALUE_ATTRIBUTE), noEvents);
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
    if (!this.isSingle() && this._isSelected(text)) {
      return false;
    }
    // Check for max
    if (this.max && this.getSelectedValues().length >= this.max) {
      return false;
    }
    // Check for regex
    if (this.validationRegex && !this._validateRegex(text)) {
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

    const bver = this._getBootstrapVersion();
    let opt = this._selectElement.querySelector('option[value="' + value + '"]');
    if (opt) {
      data = opt.dataset;
    }

    // create span
    let html = text;
    let span = document.createElement("span");
    let classes = ["badge"];
    let badgeStyle = this.badgeStyle;
    if (data.badgeStyle) {
      badgeStyle = data.badgeStyle;
    }
    if (data.badgeClass) {
      classes.push(...data.badgeClass.split(" "));
    }
    if (bver === 5) {
      //https://getbootstrap.com/docs/5.1/components/badge/
      classes = [...classes, ...["me-2", "bg-" + badgeStyle, "mw-100"]];
    } else {
      // https://getbootstrap.com/docs/4.6/components/badge/
      classes = [...classes, ...["mr-2", "badge-" + badgeStyle]];
    }
    span.classList.add(...classes);
    span.setAttribute(VALUE_ATTRIBUTE, value);

    if (this.allowClear) {
      const closeClass = classes.includes("text-dark") ? "btn-close" : "btn-close-white";
      const btn =
        bver === 5
          ? '<button type="button" style="font-size:0.65em" class="me-2 float-start btn-close ' +
            closeClass +
            '" aria-label="' +
            this.clearLabel +
            '"></button>'
          : '<button type="button" style="font-size:1em;float:left;text-shadow:none;color:currentColor;transform:scale(1.2)" class="mr-2 close" aria-label="' +
            this.clearLabel +
            '"><span aria-hidden="true">&times;</span></button>';
      html = btn + html;
    }

    span.innerHTML = html;
    this._containerElement.insertBefore(span, this._searchInput);

    if (this.allowClear) {
      span.querySelector("button").addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!this.isDisabled()) {
          this.removeItem(value);
          document.activeElement.blur();
          this._adjustWidth();
        }
      });
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

    // update select, we need to set attribute for option[selected]
    opt.setAttribute("selected", "selected");
    opt.selected = true;

    // Fire change event
    if (this._fireEvents) {
      this._selectElement.dispatchEvent(new Event("change", { bubbles: true }));
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
    let opt = this._selectElement.querySelector('option[value="' + value + '"]');
    if (opt) {
      opt.removeAttribute("selected");
      opt.selected = false;

      // Fire change event
      if (this._fireEvents && !noEvents) {
        this._selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Make input visible
    if (this._searchInput.style.visibility == "hidden" && this.max && this.getSelectedValues().length < this.max) {
      this._searchInput.style.visibility = "visible";
    }
  }
}

export default Tags;
