// ie babel fix
// @see https://stackoverflow.com/questions/53331180/babel-polyfill-being-included-but-foreach-still-doesnt-work-in-ie11-on-nodelis
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

/**
 * Create new HTML element
 * @param {String} tagName - name created tag
 * @param {String} selector - css selectors ('class1 class2...')
 * @param {String} html - html code
 * @param {HTMLElement} parent - parent of new tag
 * @param {Object} css - css styles
 * @return {HTMLElement}
 */
export function createElement({tagName, selector = '', html = null, parent = null, css = {}}) {
    let el = document.createElement(tagName);
    selector && (el.className = selector);
    Object.assign(el.style, css);

    parent && parent.appendChild(el);
    html != null && (el.innerHTML = html);
    return el;
}

/**
 * Remove dom element
 * @param {HTMLElement} el
 */
export function removeElement(el) {
    el.remove ? el.remove() : el.parentNode ? el.parentNode.removeChild(el) : null;
}

/**
 * Return array from HTML collection
 * @param {HTMLCollection} HTMLCollection
 * @return {[]}
 * @private
 */
export function _likeArray(HTMLCollection) {
    return Array.prototype.slice.call(HTMLCollection)
}

/**
 * Get node element parents
 * @param {HTMLElement} el
 * @return {[]}
 */
export function parents(el) {
    const els = [];
    while (el && el.tagName !== 'BODY') {
        els.unshift(el);
        el = el.parentNode;
    }
    return els;
}

/**
 * Clear selected area
 */
export function clearSelected() {
    let w = window,
        d = document;
    if (w.getSelection) {
        if (w.getSelection().empty) {
            w.getSelection().empty();
        } else if (w.getSelection().removeAllRanges) {
            try {
                w.getSelection().removeAllRanges();
            } catch (e) {
                // skip IE edge
            }
        }
    } else if (d.selection) {
        d.selection.empty();
    }
}

/**
 * Detect element is td|th
 * @param el
 * @return {boolean}
 */
export function isTableCell(el) {
    return ['TD', 'TH'].includes(el.tagName);
}

/**
 * aaaAaa to aaa-a-aa
 * @param string
 * @returns {String}
 */
export function camelCaseToKebabCase(string) {
    return string.replace(/[A-Z]/g, m => `-${m[0].toLowerCase()}`);
}

/**
 * aaaaa to Aaaaa
 * @param str
 * @return {String}
 */
export function firstCharToUp(str) {
    return `${str[0].toUpperCase()}${str.slice(1)}`
}

/**
 * Extract number from string
 * @param str
 * @returns {number}
 */
export function getNumberFromString(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    str = str.toString().replace(/[^0-9.,]/g, '');
    str = str.replace(/,/g, '.');
    str = str.match(/^\d*\.?\d*([^.])/);
    if (!str) return 0;
    return +str[0];
}

/**
 * Merge values
 * @param {String|Number|null} v1
 * @param {String|Number|null} v2
 * @return {String|Number|null}
 */
export function mergeValues(v1, v2) {
    let type1 = typeof v1, type2 = typeof v2;
    if (type1 === type2 && v1 === v2 && !v1) return v1; // null, empty and undefined
    if (v1 == null) v1 = '';
    if (v2 == null) v2 = '';
    return type1 === 'number' && type1 === type2 ? v1 + v2 : prepareValue(`${v1} ${v2}`)
}

/**
 * Prepare save value
 * @param val
 * @returns {string | number}
 */
export function prepareValue(val) {
    if (!val) return val;
    return typeof val === 'number' ? val : val.replace(/&nbsp;/g, ' ').replace(/\r?\n/g, '').trim()
}

/**
 * Random
 * @param min
 * @param max
 * @return {*}
 */
export function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random uniq key
 * @return {String}
 */
export function randKey() {
    return Date.now().toString().split('').reverse().map(i => rand(0, 9)).join('')
}


/**
 * Is key code ignore
 * @param key
 * @returns {Boolean}
 * @private
 */
export function _keysIgnore(key) {
    let keys = {
        'Alt': 1, 'ArrowDown': 1, 'ArrowLeft': 1, 'ArrowRight': 1, 'ArrowUp': 1, 'CapsLock': 1, 'Control': 1,
        'End': 1, 'Enter': 1, 'Escape': 1, 'F1': 1, 'F10': 1, 'F11': 1, 'F12': 1, 'F2': 1, 'F3': 1, 'F4': 1,
        'F5': 1, 'F6': 1, 'F7': 1, 'F8': 1, 'F9': 1, 'Home': 1, 'Insert': 1, 'Meta': 1, 'NumLock': 1,
        'PageDown': 1, 'PageUp': 1, 'Pause': 1, 'ScrollLock': 1, 'Shift': 1, 'Tab': 1
    };
    return !!keys[key]
}

/**
 * Split key by ::
 * @param {String} key
 * @returns {[Number, Number]}
 * @private
 */
export function _splitKey(key) {
    return key.split('::').map(i => +i)
}