/**
 * Bootstrap 5 (and 4!) tags
 *
 * Turns your select[multiple] into nice tags lists
 *
 * Required Bootstrap 5 styles:
 * - badge
 * - background-color utility
 * - margin-end utility
 * - forms
 * - dropdown
 */

const ACTIVE_CLASS = "is-active";
const ACTIVE_CLASSES = ["is-active", "bg-primary", "text-white"];
const VALUE_ATTRIBUTE = "data-value";

class Tags {
  /**
   * @param {HTMLSelectElement} el
   * @param {Object} globalOpts
   */
  constructor(el, globalOpts = {}) {
    // Hide the select element and register a tags attr
    el.style.display = "none";
    el.dataset.tags = true;
    this.selectElement = el;

    // Allow 1/0, true/false as strings
    const parseBool = (value) => ["true", "false", "1", "0", true, false].includes(value) && !!JSON.parse(value);

    // Handle options, using global settings first and data attr override
    const opts = { ...globalOpts, ...el.dataset };
    // opts = el.dataset;
    this.allowNew = opts.allowNew ? parseBool(opts.allowNew) : false;
    this.showAllSuggestions = opts.showAllSuggestions ? parseBool(opts.showAllSuggestions) : false;
    this.badgeStyle = opts.badgeStyle || "primary";
    this.allowClear = opts.allowClear ? parseBool(opts.allowClear) : false;
    this.server = opts.server || false;
    this.liveServer = opts.liveServer ? parseBool(opts.liveServer) : false;
    this.suggestionsThreshold = opts.suggestionsThreshold ? parseInt(opts.suggestionsThreshold) : 1;
    this.validationRegex = opts.regex || "";
    this.separator = opts.separator ? opts.separator.split("|") : [];
    this.max = opts.max ? parseInt(opts.max) : null;
    this.clearLabel = opts.clearLabel || "Clear";
    this.searchLabel = opts.searchLabel || "Type a value";

    this.placeholder = this.getPlaceholder();
    this.keyboardNavigation = false;

    this.parentForm = el.parentElement;
    while (this.parentForm) {
      this.parentForm = this.parentForm.parentElement;
      if (this.parentForm.nodeName == "FORM") {
        break;
      }
    }
    this.parentForm.addEventListener("reset", (ev) => {
      this.reset();
    });

    // Create elements
    this.holderElement = document.createElement("div"); // this is the one holding the fake input and the dropmenu
    this.containerElement = document.createElement("div"); // this is the one for the fake input (labels + input)
    this.dropElement = document.createElement("ul");
    this.searchInput = document.createElement("input");

    this.holderElement.appendChild(this.containerElement);
    this.containerElement.appendChild(this.searchInput);
    this.holderElement.appendChild(this.dropElement);
    // insert after
    this.selectElement.parentNode.insertBefore(this.holderElement, this.selectElement.nextSibling);

    // Configure them
    this.configureSearchInput();
    this.configureHolderElement();
    this.configureDropElement();
    this.configureContainerElement();

    if (this.server && !this.liveServer) {
      this.loadFromServer();
    } else {
      let suggestions = Array.from(this.selectElement.querySelectorAll("option")).map((option) => {
        return {
          value: option.getAttribute("value"),
          label: option.innerText,
        };
      });
      this.buildSuggestions(suggestions);
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
      if (!list[i].dataset.tags) {
        new Tags(list[i], opts);
      }
    }
  }

  /**
   * @param {boolean} show
   */
  loadFromServer(show = false) {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    fetch(this.server + "?query=" + encodeURIComponent(this.searchInput.value), { signal: this.abortController.signal })
      .then((r) => r.json())
      .then((suggestions) => {
        let data = suggestions.data || suggestions;
        this.buildSuggestions(data);
        this.abortController = null;
        if (show) {
          this.showSuggestions();
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
  getPlaceholder() {
    let firstOption = this.selectElement.querySelector("option");
    if (!firstOption) {
      return;
    }
    if (!firstOption.value) {
      let placeholder = firstOption.innerText;
      firstOption.remove();
      return placeholder;
    }
    if (this.selectElement.getAttribute("placeholder")) {
      return this.selectElement.getAttribute("placeholder");
    }
    if (this.selectElement.getAttribute("data-placeholder")) {
      return this.selectElement.getAttribute("data-placeholder");
    }
    return "";
  }

  configureDropElement() {
    this.dropElement.classList.add("dropdown-menu");
    this.dropElement.classList.add("p-0");
    this.dropElement.style.maxHeight = "280px";
    this.dropElement.style.overflowY = "auto";

    // If the mouse was outside, entering remove keyboard nav mode
    this.dropElement.addEventListener("mouseenter", (event) => {
      this.keyboardNavigation = false;
    });
  }

  configureHolderElement() {
    this.holderElement.classList.add("form-control");
    this.holderElement.classList.add("dropdown");
    if (this.isDisabled()) {
      this.holderElement.setAttribute("readonly", "");
    }
    if (this.getBootstrapVersion() === 4) {
      // Prevent fixed height due to form-control
      this.holderElement.style.height = "auto";
    }
  }

  configureContainerElement() {
    this.containerElement.addEventListener("click", (event) => {
      if (this.isDisabled()) {
        return;
      }
      this.searchInput.focus();
    });

    // add initial values
    let initialValues = this.selectElement.querySelectorAll("option[selected]");
    for (let j = 0; j < initialValues.length; j++) {
      let initialValue = initialValues[j];
      if (!initialValue.value) {
        continue;
      }
      // track initial values for reset
      initialValue.dataset.init = 1;
      this.addItem(initialValue.innerText, initialValue.value);
    }
  }

  configureSearchInput() {
    let self = this;
    this.searchInput.type = "text";
    this.searchInput.autocomplete = "off";
    this.searchInput.style.backgroundColor = "transparent";
    this.searchInput.style.border = 0;
    this.searchInput.style.outline = 0;
    this.searchInput.style.maxWidth = "100%";
    this.searchInput.ariaLabel = this.searchLabel;
    if (this.isDisabled()) {
      this.searchInput.setAttribute("disabled", "");
    }
    this.adjustWidth();

    this.searchInput.addEventListener("input", (event) => {
      this.adjustWidth();
      if (this.searchInput.value.length >= this.suggestionsThreshold) {
        if (this.liveServer) {
          this.loadFromServer(true);
        } else {
          this.showSuggestions();
        }
      } else {
        this.hideSuggestions();
      }
    });
    this.searchInput.addEventListener("focus", (event) => {
      if (this.searchInput.value.length >= this.suggestionsThreshold) {
        this.showSuggestions();
      }
    });
    this.searchInput.addEventListener("focusout", (event) => {
      self.hideSuggestions();
    });
    // keypress doesn't send arrow keys
    this.searchInput.addEventListener("keydown", (event) => {
      // Keycode reference : https://css-tricks.com/snippets/javascript/javascript-keycodes/
      let key = event.keyCode || event.key;
      if (this.separator.length && this.separator.includes(event.key)) {
        event.preventDefault();
        let res = this.addItem(this.searchInput.value, null);
        if (res) {
          this.resetSearchInput();
        }
        return;
      }
      switch (key) {
        case 13:
        case "Enter":
          let selection = this.getActiveSelection();
          if (selection) {
            selection.click();
          } else {
            // We use what is typed if not selected and not empty
            if (this.allowNew && !this.isSelected(this.searchInput.value) && this.searchInput.value) {
              let res = this.addItem(this.searchInput.value, null);
              if (res) {
                this.resetSearchInput();
              }
            }
          }
          event.preventDefault();
          break;
        case 38:
        case "ArrowUp":
          event.preventDefault();
          this.keyboardNavigation = true;
          let newSelection = this.moveSelectionUp();
          // If we use arrow up without input and there is no new selection, hide suggestions
          if (this.searchInput.value.length == 0 && this.dropElement.classList.contains("show") && !newSelection) {
            this.hideSuggestions();
          }
          break;
        case 40:
        case "ArrowDown":
          event.preventDefault();
          this.keyboardNavigation = true;
          this.moveSelectionDown();
          // If we use arrow down without input, show suggestions
          if (this.searchInput.value.length == 0 && !this.dropElement.classList.contains("show")) {
            this.showSuggestions();
          }
          break;
        case 8:
        case "Backspace":
          if (this.searchInput.value.length == 0) {
            this.removeLastItem();
            this.adjustWidth();
            this.hideSuggestions();
          }
          break;
      }
    });
  }

  /**
   * @returns {HTMLElement}
   */
  moveSelectionUp() {
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
  moveSelectionDown() {
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
   * Adjust the field to fit its content
   */
  adjustWidth() {
    if (this.searchInput.value) {
      this.searchInput.size = this.searchInput.value.length + 1;
    } else {
      // Show the placeholder only if empty
      if (this.getSelectedValues().length) {
        this.searchInput.placeholder = "";
        this.searchInput.size = 1;
      } else {
        this.searchInput.size = this.placeholder.length;
        this.searchInput.placeholder = this.placeholder;
      }
    }
  }

  /**
   * Add suggestions to the drop element
   * @param {array}
   */
  buildSuggestions(suggestions = null) {
    while (this.dropElement.lastChild) {
      this.dropElement.removeChild(this.dropElement.lastChild);
    }
    for (let i = 0; i < suggestions.length; i++) {
      let suggestion = suggestions[i];
      if (!suggestion.value) {
        continue;
      }
      let newChild = document.createElement("li");
      let newChildLink = document.createElement("a");
      newChild.append(newChildLink);
      newChildLink.classList.add("dropdown-item");
      newChildLink.setAttribute(VALUE_ATTRIBUTE, suggestion.value);
      newChildLink.setAttribute("href", "#");
      newChildLink.innerText = suggestion.label;
      if (suggestion.data) {
        for (const [key, value] of Object.entries(suggestion.data)) {
          newChildLink.dataset[key] = value;
        }
      }
      this.dropElement.appendChild(newChild);

      // Hover sets active item
      newChildLink.addEventListener("mouseenter", (event) => {
        // Don't trigger enter if using arrows
        if (this.keyboardNavigation) {
          return;
        }
        this.removeActiveSelection();
        newChild.querySelector("a").classList.add(...ACTIVE_CLASSES);
      });
      // Moving the mouse means no longer using keyboard
      newChildLink.addEventListener("mousemove", (event) => {
        this.keyboardNavigation = false;
      });

      newChildLink.addEventListener("mousedown", (event) => {
        // Otherwise searchInput would lose focus and close the menu
        event.preventDefault();
      });
      newChildLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.addItem(newChildLink.innerText, newChildLink.getAttribute(VALUE_ATTRIBUTE), newChildLink.dataset);
        this.resetSearchInput();
      });
    }
  }

  reset() {
    this.removeAll();
    let initialValues = this.selectElement.querySelectorAll("option[data-init]");
    for (let j = 0; j < initialValues.length; j++) {
      let initialValue = initialValues[j];
      this.addItem(initialValue.innerText, initialValue.value);
    }
  }

  resetSearchInput() {
    this.searchInput.value = "";
    this.adjustWidth();
    this.hideSuggestions();

    // We use visibility instead of display to keep layout intact
    if (this.max && this.getSelectedValues().length === this.max) {
      this.searchInput.style.visibility = "hidden";
    } else if (this.searchInput.style.visibility == "hidden") {
      this.searchInput.style.visibility = "visible";
    }
  }

  /**
   * @returns {array}
   */
  getSelectedValues() {
    let selected = this.selectElement.querySelectorAll("option:checked");
    return Array.from(selected).map((el) => el.value);
  }

  /**
   * The element create with buildSuggestions
   */
  showSuggestions() {
    if (!this.dropElement.classList.contains("show")) {
      this.dropElement.classList.add("show");
    }

    // Position next to search input
    this.dropElement.style.left = this.searchInput.offsetLeft + "px";

    // Get search value
    let search = this.searchInput.value.toLocaleLowerCase();

    // Get current values
    let values = this.getSelectedValues();

    // Filter the list according to search string
    let list = this.dropElement.querySelectorAll("li");
    let found = false;
    let firstItem = null;
    let hasPossibleValues = false;
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      let text = item.innerText.toLocaleLowerCase();
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

    // Special case if nothing matches
    if (!found) {
      this.dropElement.classList.remove("show");
    }

    // Always select first item
    if (firstItem) {
      if (this.holderElement.classList.contains("is-invalid")) {
        this.holderElement.classList.remove("is-invalid");
      }
      firstItem.querySelector("a").classList.add(...ACTIVE_CLASSES);
      firstItem.parentNode.scrollTop = firstItem.offsetTop - firstItem.parentNode.offsetTop;
    } else {
      // No item and we don't allow new items => error
      if (!this.allowNew && !(search.length === 0 && !hasPossibleValues)) {
        this.holderElement.classList.add("is-invalid");
      } else if (this.validationRegex && this.holderElement.classList.contains("is-invalid")) {
        this.holderElement.classList.remove("is-invalid");
      }
    }
  }

  /**
   * The element create with buildSuggestions
   */
  hideSuggestions() {
    if (this.dropElement.classList.contains("show")) {
      this.dropElement.classList.remove("show");
    }
    if (this.holderElement.classList.contains("is-invalid")) {
      this.holderElement.classList.remove("is-invalid");
    }
  }

  /**
   * @returns {HTMLElement}
   */
  getActiveSelection() {
    return this.dropElement.querySelector("a." + ACTIVE_CLASS);
  }

  removeActiveSelection() {
    let selection = this.getActiveSelection();
    if (selection) {
      selection.classList.remove(...ACTIVE_CLASSES);
    }
  }

  removeAll() {
    let items = this.containerElement.querySelectorAll("span");
    items.forEach((item) => {
      this.removeLastItem();
    });
  }

  removeLastItem() {
    let items = this.containerElement.querySelectorAll("span");
    if (!items.length) {
      return;
    }
    let lastItem = items[items.length - 1];
    this.removeItem(lastItem.getAttribute(VALUE_ATTRIBUTE));
  }

  /**
   * @returns {Number}
   */
  getBootstrapVersion() {
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
  isSelected(text) {
    const opt = Array.from(this.selectElement.querySelectorAll("option")).find((el) => el.textContent == text);
    if (opt && opt.getAttribute("selected")) {
      return true;
    }
    return false;
  }

  isDisabled() {
    return this.selectElement.hasAttribute("disabled") || this.selectElement.hasAttribute("readonly");
  }

  /**
   * Checks if value matches a configured regex
   * @param {string} value
   * @returns {boolean}
   */
  validateRegex(value) {
    const regex = new RegExp(this.validationRegex.trim());
    return regex.test(value);
  }

  /**
   * @param {string} text
   * @param {string} value
   * @param {object} data
   * @return {boolean}
   */
  addItem(text, value = null, data = {}) {
    if (!value) {
      value = text;
    }

    if (this.validationRegex && !this.validateRegex(text)) {
      this.holderElement.classList.add("is-invalid");
      return false;
    }

    const bver = this.getBootstrapVersion();
    let opt = this.selectElement.querySelector('option[value="' + value + '"]');
    if (opt) {
      data = opt.dataset;
    }

    // create span
    let html = text;
    let span = document.createElement("span");
    let badgeStyle = this.badgeStyle;
    span.classList.add("badge");
    if (data.badgeStyle) {
      badgeStyle = data.badgeStyle;
    }
    if (data.badgeClass) {
      span.classList.add(data.badgeClass);
    }
    if (bver === 5) {
      //https://getbootstrap.com/docs/5.1/components/badge/
      span.classList.add("bg-" + badgeStyle);
      span.classList.add("me-2");
    } else {
      // https://getbootstrap.com/docs/4.6/components/badge/
      span.classList.add("badge-" + badgeStyle);
      span.classList.add("mr-2");
    }
    span.setAttribute(VALUE_ATTRIBUTE, value);

    if (this.allowClear && !this.isDisabled()) {
      const btn =
        bver === 5
          ? '<button type="button" style="font-size:0.65em" class="me-2 btn-close btn-close-white" aria-label="' + this.clearLabel + '"></button>'
          : '<button type="button" style="font-size:1em;float:left;text-shadow:none;color:currentColor;" class="mr-2 close" aria-label="' + this.clearLabel + '"><span aria-hidden="true">&times;</span></button>';
      html = btn + html;
    }

    span.innerHTML = html;
    this.containerElement.insertBefore(span, this.searchInput);

    if (this.allowClear && !this.isDisabled()) {
      span.querySelector("button").addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.removeItem(value);
        document.activeElement.blur();
      });
    }

    // update select, we need to set attribute for isSelected
    if (opt) {
      opt.setAttribute("selected", "selected");
    } else {
      // we need to create a new option
      opt = document.createElement("option");
      opt.value = value;
      opt.innerText = text;
      // Pass along data provided
      for (const [key, value] of Object.entries(data)) {
        opt.dataset[key] = value;
      }
      opt.setAttribute("selected", "selected");
      this.selectElement.appendChild(opt);
    }

    return true;
  }

  /**
   * @param {string} value
   */
  removeItem(value) {
    let item = this.containerElement.querySelector("span[" + VALUE_ATTRIBUTE + '="' + value + '"]');
    if (!item) {
      return;
    }
    item.remove();

    // update select
    let opt = this.selectElement.querySelector('option[value="' + value + '"]');
    if (opt) {
      opt.removeAttribute("selected");
    }

    if (this.searchInput.style.visibility == "hidden" && this.max && this.getSelectedValues().length < this.max) {
      this.searchInput.style.visibility = "visible";
    }
  }
}

export default Tags;
