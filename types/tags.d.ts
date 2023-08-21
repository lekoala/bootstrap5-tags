export default Tags;
export type EventCallback = (event: Event, inst: Tags) => void;
export type ServerCallback = (response: Response, inst: Tags) => Promise<any>;
export type ModalItemCallback = (value: string, inst: Tags) => Promise<any>;
export type RenderCallback = (item: Suggestion, label: string, inst: Tags) => string;
export type ItemCallback = (item: Suggestion, inst: Tags) => void;
export type ValueCallback = (value: string, inst: Tags) => void;
export type AddCallback = (value: string, data: any, inst: Tags) => void | boolean;
export type CreateCallback = (option: HTMLOptionElement, inst: Tags) => void;
export type Config = {
    /**
     * Source items
     */
    items: Array<Suggestion | SuggestionGroup>;
    /**
     * Allows creation of new tags
     */
    allowNew: boolean;
    /**
     * Show all suggestions even if they don't match. Disables validation.
     */
    showAllSuggestions: boolean;
    /**
     * Color of the badge (color can be configured per option as well)
     */
    badgeStyle: string;
    /**
     * Show a clear icon
     */
    allowClear: boolean;
    /**
     * Place clear icon at the end
     */
    clearEnd: boolean;
    /**
     * A list of initially selected values
     */
    selected: any[];
    /**
     * Regex for new tags
     */
    regex: string;
    /**
     * A list (pipe separated) of characters that should act as separator (default is using enter key)
     */
    separator: any[] | string;
    /**
     * Limit to a maximum of tags (0 = no limit)
     */
    max: number;
    /**
     * Provides a placeholder if none are provided as the first empty option
     */
    placeholder: string;
    /**
     * Text as clear tooltip
     */
    clearLabel: string;
    /**
     * Default placeholder
     */
    searchLabel: string;
    /**
     * Show dropdown icon
     */
    showDropIcon: boolean;
    /**
     * Keep suggestions open after selection, clear on focus out
     */
    keepOpen: boolean;
    /**
     * Allow same tags used multiple times
     */
    allowSame: boolean;
    /**
     * Customize the class applied to badges
     */
    baseClass: string;
    /**
     * Add new tags on blur (only if allowNew is enabled)
     */
    addOnBlur: boolean;
    /**
     * Show disabled tags
     */
    showDisabled: boolean;
    /**
     * Hide native validation tooltips
     */
    hideNativeValidation: boolean;
    /**
     * Number of chars required to show suggestions
     */
    suggestionsThreshold: number;
    /**
     * Maximum number of items to display
     */
    maximumItems: number;
    /**
     * Always select the first item
     */
    autoselectFirst: boolean;
    /**
     * Update input value on selection (doesn't play nice with autoselectFirst)
     */
    updateOnSelect: boolean;
    /**
     * Highlight matched part of the suggestion
     */
    highlightTyped: boolean;
    /**
     * Class applied to the mark element
     */
    highlightClass: string;
    /**
     * Match the width on the input field
     */
    fullWidth: boolean;
    /**
     * Use fixed positioning (solve overflow issues)
     */
    fixed: boolean;
    /**
     * Fuzzy search
     */
    fuzzy: boolean;
    /**
     * Must start with the string. Defaults to false (it matches any position).
     */
    startsWith: boolean;
    /**
     * Show badge for single elements
     */
    singleBadge: boolean;
    /**
     * By default: ["bg-primary", "text-white"]
     */
    activeClasses: any[];
    /**
     * Key for the label
     */
    labelField: string;
    /**
     * Key for the value
     */
    valueField: string;
    /**
     * Key for the search
     */
    searchFields: any[];
    /**
     * Name of the param passed to endpoint (query by default)
     */
    queryParam: string;
    /**
     * Endpoint for data provider
     */
    server: string;
    /**
     * HTTP request method for data provider, default is GET
     */
    serverMethod: string;
    /**
     * Parameters to pass along to the server. You can specify a "related" key with the id of a related field.
     */
    serverParams: string | any;
    /**
     * By default: data
     */
    serverDataKey: string;
    /**
     * Any other fetch options (https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax)
     */
    fetchOptions: any;
    /**
     * Should the endpoint be called each time on input
     */
    liveServer: boolean;
    /**
     * Prevent caching by appending a timestamp
     */
    noCache: boolean;
    /**
     * Debounce time for live server
     */
    debounceTime: number;
    /**
     * Display a no suggestions found message. Leave empty to disable
     */
    notFoundMessage: string;
    /**
     * Callback function that returns the suggestion
     */
    onRenderItem: RenderCallback;
    /**
     * Callback function to call on selection
     */
    onSelectItem: ItemCallback;
    /**
     * Callback function to call on clear
     */
    onClearItem: ValueCallback;
    /**
     * Callback function when an item is created
     */
    onCreateItem: CreateCallback;
    /**
     * Callback function on blur
     */
    onBlur: EventCallback;
    /**
     * Callback function on focus
     */
    onFocus: EventCallback;
    /**
     * Callback function to validate item. Return false to show validation message.
     */
    onCanAdd: AddCallback;
    /**
     * Callback function to process server response. Must return a Promise
     */
    onServerResponse: ServerCallback;
    /**
     * Allow modal confirmation of clear. Must return a Promise
     */
    confirmClear: ModalItemCallback;
    /**
     * Allow modal confirmation of add. Must return a Promise
     */
    confirmAdd: ModalItemCallback;
};
export type Suggestion = {
    /**
     * Can be overriden by config valueField
     */
    value: string;
    /**
     * Can be overriden by config labelField
     */
    label: string;
    disabled: boolean;
    data: any;
    selected?: boolean;
    group_id?: number;
};
export type SuggestionGroup = {
    group: string;
    items: any[];
};
/**
 * @param {HTMLElement} el
 * @param {HTMLElement} newEl
 * @returns {HTMLElement}
 */
declare class Tags {
    /**
     * Attach to all elements matched by the selector
     * @param {string} selector
     * @param {Object} opts
     */
    static init(selector?: string, opts?: any): void;
    /**
     * @param {HTMLSelectElement} el
     */
    static getInstance(el: HTMLSelectElement): any;
    /**
     * @param {HTMLSelectElement} el
     * @param {Object|Config} config
     */
    constructor(el: HTMLSelectElement, config?: any | Config);
    _selectElement: HTMLSelectElement;
    _keyboardNavigation: boolean;
    _searchFunc: Function;
    _fireEvents: boolean;
    _holderElement: any;
    _containerElement: any;
    _dropElement: any;
    _searchInput: any;
    /**
     * event-polyfill compat / handleEvent is expected on class
     * @link https://github.com/lifaon74/events-polyfill/issues/10
     * @param {Event} event
     */
    handleEvent(event: Event): void;
    dispose(): void;
    /**
     * @link https://gist.github.com/WebReflection/ec9f6687842aa385477c4afca625bbf4#handling-events
     * @param {Event} event
     */
    _handleEvent(event: Event): void;
    _timer: number;
    /**
     * @param {Config|Object} config
     */
    _configure(config?: Config | any): void;
    _config: any;
    /**
     * @param {String} k
     * @returns {*}
     */
    config(k?: string): any;
    /**
     * @param {String} k
     * @param {*} v
     */
    setConfig(k: string, v: any): void;
    /**
     * Find overflow parent for positioning
     * and bind reset event of the parent form
     */
    _configureParent(): void;
    overflowParent: any;
    parentForm: any;
    /**
     * @returns {string}
     */
    _getPlaceholder(): string;
    _configureSelectElement(): void;
    /**
     * Configure drop element
     * Needs to be called after searchInput is created
     */
    _configureDropElement(): void;
    _configureHolderElement(): void;
    _configureContainerElement(): void;
    _configureSearchInput(): void;
    _rtl: boolean;
    onfocus(event: any): void;
    onblur(event: any): void;
    oninput(ev: any): void;
    /**
     * keypress doesn't send arrow keys, so we use keydown
     * @param {KeyboardEvent} event
     */
    onkeydown(event: KeyboardEvent): void;
    onmousemove(e: any): void;
    onmouseleave(e: any): void;
    onscroll(e: any): void;
    onresize(e: any): void;
    onclick(e?: any): void;
    onreset(e: any): void;
    /**
     * @param {Boolean} init called during init
     */
    loadData(init?: boolean): void;
    /**
     * Make sure we have valid selected attributes
     */
    _setSelectedAttributes(): void;
    resetState(): void;
    /**
     * Reset suggestions from select element
     * Iterates over option children then calls setData
     * @param {Boolean} init called during init
     */
    resetSuggestions(init?: boolean): void;
    /**
     * Try to add the current value
     * @returns {Boolean}
     */
    _enterValue(): boolean;
    /**
     * @param {Boolean} show Show menu after load. False during init
     */
    _loadFromServer(show?: boolean): void;
    _abortController: AbortController;
    /**
     * Wrapper for the public addItem method that check if the item
     * can be added
     *
     * @param {string} text
     * @param {string} value
     * @param {object} data
     * @returns {HTMLOptionElement|null}
     */
    _add(text: string, value?: string, data?: object): HTMLOptionElement | null;
    /**
     * @param {HTMLElement} li
     * @returns {Boolean}
     */
    _isItemEnabled(li: HTMLElement): boolean;
    /**
     * @param {String} dir
     * @param {*|HTMLElement} sel
     * @returns {HTMLElement}
     */
    _moveSelection(dir?: string, sel?: any | HTMLElement): HTMLElement;
    /**
     * Adjust the field to fit its content and show/hide placeholder if needed
     */
    _adjustWidth(): void;
    /**
     * Add suggestions to the drop element
     * @param {Array<Suggestion|SuggestionGroup>} suggestions
     */
    _buildSuggestions(suggestions: Array<Suggestion | SuggestionGroup>): void;
    /**
     * @param {Suggestion} suggestion
     * @param {Number} i The global counter
     */
    _buildSuggestionsItem(suggestion: Suggestion, i: number): void;
    /**
     * @returns {NodeListOf<HTMLOptionElement>}
     */
    initialOptions(): NodeListOf<HTMLOptionElement>;
    /**
     * Call this before looping in a list that calls addItem
     * This will make sure addItem will not add incorrectly options to the select
     */
    _removeSelectedAttrs(): void;
    reset(): void;
    /**
     * @param {Boolean} init Pass true during init
     */
    resetSearchInput(init?: boolean): void;
    /**
     * @returns {Array}
     */
    getSelectedValues(): any[];
    /**
     * @returns {Array}
     */
    getAvailableValues(): any[];
    /**
     * Show suggestions or search them depending on live server
     * @param {Boolean} check
     */
    showOrSearch(check?: boolean): void;
    /**
     * The element create with buildSuggestions
     * @param {Boolean} clearValidation
     */
    hideSuggestions(clearValidation?: boolean): void;
    /**
     * Show or hide suggestions
     * @param {Boolean} check
     * @param {Boolean} clearValidation
     */
    toggleSuggestions(check?: boolean, clearValidation?: boolean): void;
    /**
     * Do we have enough input to show suggestions ?
     * @returns {Boolean}
     */
    _shouldShow(): boolean;
    /**
     * The element create with buildSuggestions
     */
    _showSuggestions(): void;
    _showDropdown(): void;
    /**
     * @param {Boolean} wasVisible
     */
    _positionMenu(wasVisible?: boolean): void;
    /**
     * @returns {Number}
     */
    _getBootstrapVersion(): number;
    /**
     * Find if label is already selected (based on attribute)
     * @param {string} text
     * @returns {Boolean}
     */
    _isSelected(text: string): boolean;
    /**
     * Find if label is already selectable (based on attribute)
     * @param {string} text
     * @returns {Boolean}
     */
    _isSelectable(text: string): boolean;
    /**
     * Find if label is selectable (based on attribute)
     * @param {string} text
     * @returns {Boolean}
     */
    hasItem(text: string): boolean;
    /**
     * Checks if value matches a configured regex
     * @param {string} value
     * @returns {Boolean}
     */
    _validateRegex(value: string): boolean;
    /**
     * @returns {HTMLElement}
     */
    getSelection(): HTMLElement;
    removeSelection(): void;
    /**
     * @returns {Array}
     */
    _activeClasses(): any[];
    /**
     * @deprecated since 1.5
     * @returns {HTMLElement}
     */
    getActiveSelection(): HTMLElement;
    /**
     * @deprecated since 1.5
     */
    removeActiveSelection(): void;
    /**
     * Remove all items
     */
    removeAll(): void;
    /**
     * @param {Boolean} noEvents
     */
    removeLastItem(noEvents?: boolean): void;
    getLastItem(): any;
    enable(): void;
    disable(): void;
    /**
     * @returns {Boolean}
     */
    isDisabled(): boolean;
    /**
     * @returns {Boolean}
     */
    isDropdownVisible(): boolean;
    /**
     * @returns {Boolean}
     */
    isInvalid(): boolean;
    /**
     * @returns {Boolean}
     */
    isSingle(): boolean;
    /**
     * @returns {Boolean}
     */
    isMaxReached(): boolean;
    /**
     * @param {string} text
     * @param {Object} data
     * @returns {Boolean}
     */
    canAdd(text: string, data?: any): boolean;
    getData(): any;
    /**
     * Set data
     * @param {Array<Suggestion|SuggestionGroup>|Object} src An array of items or a value:label object
     * @param {Boolean} init called during init
     */
    setData(src: Array<Suggestion | SuggestionGroup> | any, init?: boolean): void;
    /**
     * Keep in mind that we can have the same value for multiple options
     * @param {*} value
     * @param {string} mode
     * @param {number} counter
     * @returns {HTMLOptionElement|null}
     */
    _findOption(value?: any, mode?: string, counter?: number): HTMLOptionElement | null;
    /**
     * You might want to use canAdd before to ensure the item is valid
     * @param {string} text
     * @param {string} value
     * @param {object} data
     * @return {HTMLOptionElement} The created or selected option
     */
    addItem(text: string, value?: string, data?: object): HTMLOptionElement;
    /**
     * mobile safari is doing it's own crazy thing...
     * without this, it wil not pick up the proper state of the select element and validation will fail
     */
    _resetHtmlState(): void;
    /**
     * @param {string} text
     * @param {string} value
     * @param {object} data
     */
    _createBadge(text: string, value?: string, data?: object): void;
    /**
     * @param {string} value
     * @param {Boolean} value
     */
    removeItem(value: string, noEvents?: boolean): void;
}
