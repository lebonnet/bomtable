/**
 * Create new HTML element
 * @param {string} tagName - name created tag
 * @param {string} selector - css selectors ('class1 class2...')
 * @param {String} html - html code
 * @param {HTMLElement} parent - parent of new tag
 * @param {Object} css - css styles
 * @return {HTMLElement}
 */
export function createElement({tagName, selector = '', html = null, parent = null, css = {}}) {
    let el = document.createElement(tagName);
    el.className = selector;
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
 * @returns {string}
 */
export function camelCaseToKebabCase(string) {
    return string.replace(/[A-Z]/g, m => `-${m[0].toLowerCase()}`);
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
 * Prepare save value
 * @param val
 * @returns {string | number}
 */
export function prepareValue(val) {
    if (!val) return val;
    return !isNaN(+val) ? +val : val.replace(/&nbsp;/g, ' ').replace(/\r?\n/g, '').trim()
}