/**
 * Create new HTML element
 * @param {string} tagName - name created tag
 * @param {string} selector - css selectors ('class1 class2...')
 * @param {HTMLElement} parent - parent of new tag
 * @param {Object} css - css styles
 * @return {HTMLElement}
 */
export function createElement(tagName, selector = '', parent = null, css = {}) {
    let el = document.createElement(tagName);
    el.className = selector;
    Object.assign(el.style, css);

    parent && parent.appendChild(el);
    return el;
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
 * @param {Node} el
 * @return {Array}closeMenu
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
    let w = window;
    if (w.getSelection) {
        if (w.getSelection().empty) {
            w.getSelection().empty();
        } else if (w.getSelection().removeAllRanges) {
            w.getSelection().removeAllRanges();
        }
    } else if (d.selection) {
        d.selection.empty();
    }
}