import * as helper from "./helper";
import * as v from "../../version.json";

const
    d = document,
    w = window;

let instance = null;

export default class BomTable {

    constructor(opts = {}) {

        /**
         * Config
         * @type {Object}
         */
        this.config = Object.assign({
            data: [], // data for table body
            header: '', // table header
            tableClass: '', // css class table
            touchSupport: true, // support touch in browsers
            container: null, // node or selector for mount table
            rowsClass: '', // css class for table rows
            colsClass: '', // css class for table cols

            renders: null,

            // context menu
            contextMenu: {
                items: {
                    addRow: 'add row',
                    addCol: 'add col',
                    hr: '',
                    removeRows: 'remove rows',
                    removeCols: 'remove cols',
                    hr1: '',
                    unionCols: 'union cols'
                },
                callback: null // function can be call after click context menu item
            },

            hooks: {},
            // header menu, cooking like context menu
            headerMenu: null
        }, opts);

        this.isTouch = this.config.touchSupport && 'ontouchstart' in window;
        this.version = v.version;

        return instance = this._ini();
    }

    /**
     * Is key code ignore
     * @param key
     * @returns {Boolean}
     * @private
     */
    static _keysIgnore(key) {
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
    static _splitKey(key) {
        return key.split('::').map(i => +i)
    }

    /**
     * Initialization
     * @returns {BomTable}
     * @private
     */
    _ini() {
        return this.clear()._render()._callListeners();
    }

    /**
     * Add event listeners
     * @return {BomTable}
     * @private
     */
    _callListeners() {

        if (this.isTouch) {
            d.addEventListener('touchstart', this._onmousedown, {passive: false, cancelable: true});
            d.addEventListener('touchend', this._onmouseup);

            w.addEventListener('touchmove', this._ontouchmove, {passive: false, cancelable: true});
        } else {
            d.addEventListener('mousedown', this._onmousedown);
            d.addEventListener('mouseup', this._onmouseup);
        }

        d.addEventListener('mousemove', this._onmousemove);
        d.addEventListener('mouseover', this._onmouseover);

        d.addEventListener('dblclick', this._ondblclick);
        d.addEventListener('contextmenu', this._oncontextmenu);

        d.addEventListener('keydown', this._keyDownWatcher);

        return this;
    }

    /**
     * Set new data
     * @param {Array} data
     */
    set data(data) {
        if (!Array.isArray(data)) throw new Error('Data must be an array');
        this.config.header = this.header;
        this.config.data = data;
        this.clear()._render();
    }

    /**
     * Get table data
     * @return {Array}
     */
    get data() {
        return this.instanceData;
    }

    /**
     * Set new header
     * @param {Array} header
     */
    set header(header) {
        if (header && !Array.isArray(header)) throw new Error('Header must be an array');
        this.config.header = header;
        this.removeHeader()._renderHeader().render();
    }

    /**
     * Get table header
     * @return {Array}
     */
    get header() {
        return this.instanceHeader;
    }

    /**
     * Set new cell value
     * @param {number} col - col number of cell
     * @param {number} row - row number of cell
     * @param {*} val - new value
     */
    set dataCell({col, row, val}) {
        val = helper.prepareValue(val);
        this.dataMap[`${col}::${row}`].innerHTML = val;
        this.instanceData[row][col] = val;
        this._rerenderActiveArea();
        return this;
    }

    /**
     * Get cell value
     * @param {number} col - col number of cell
     * @param {number} row - row number of cell
     * @return {*}
     */
    get dataCell() {
        return (col, row) => {
            return this.instanceData[row][col];
        }
    }

    /**
     * Set any data for cell by prop name
     * @param {Number} col
     * @param {Number} row
     * @param {String} propName
     * @param {*} val
     * @return {BomTable}
     */
    set metaDataCell({col, row, propName, val}) {
        let el = this.dataMap[`${col}::${row}`],
            key = el.dataset.metaKey;
        if (!this.cellMeta[key]) {
            this.cellMeta[key] = {}
        }
        this.cellMeta[key][propName] = val;
        return this;
    }

    /**
     * Get cell meta data by prop name
     * @param {Number} col
     * @param {Number} row
     * @param {String} propName
     * @return {*}
     */
    get metaDataCell() {
        return ({col, row, propName}) => {
            let el = this.dataMap[`${col}::${row}`];
            if (!el) return undefined;
            let key = el.dataset.metaKey;
            if (!this.cellMeta[key]) return undefined;
            return this.cellMeta[key][propName];
        }
    }

    /**
     * Delete cell meta data
     * @param col
     * @param row
     * @param propName
     */
    removeMetaDataCell({col, row, propName}) {
        let el = this.dataMap[`${col}::${row}`],
            key = el.dataset.metaKey;
        if (!this.cellMeta[key]) return;
        delete this.cellMeta[key][propName]
    }

    /**
     * Set new row data
     * @param {Number} row
     * @param {Array} data
     */
    set dataRow({row, data}) {
        if (!this.instanceData[row]) return;
        this.instanceData[row].forEach((cell, cellIndex) => {
            let newVal = data[cellIndex] !== undefined ? helper.prepareValue(data[cellIndex]) : '';
            if (newVal === cell) return;
            this.dataMap[`${cellIndex}::${row}`].innerHTML = newVal;
            this.instanceData[row][cellIndex] = newVal;
        });

        this._rerenderActiveArea();
        return this;
    }

    /**
     * Get row by index
     * @param {number} row - row index
     * @return {Array}
     */
    get dataRow() {
        return row => this.instanceData[row]
    }

    /**
     * Set new col data
     * @param {Number} col
     * @param {Array} data
     * @return {BomTable}
     */
    set dataCol({col, data}) {
        this.instanceData.forEach((row, rowIndex) => {
            let newVal = data[rowIndex] !== undefined ? helper.prepareValue(data[rowIndex]) : '',
                cell = row[col];
            if (newVal === cell) return;
            this.dataMap[`${col}::${rowIndex}`].innerHTML = newVal;
            this.instanceData[rowIndex][col] = newVal;
        });

        this._rerenderActiveArea();
        return this;
    }

    /**
     * Get col by index
     * @return {Array}
     */
    get dataCol() {
        return col => this.instanceData.map(row => row[col])
    }

    /**
     * Get selected map
     * @return {*|Array}
     */
    get selectedMap() {
        return this.selected.sort();
    }

    /**
     * Get data from selected items
     * @return {Array}
     */
    get selectedData() {
        let data = {};

        this.selectedMap.forEach(key => {
            let [colNum, rowNum] = BomTable._splitKey(key);
            if (!data[rowNum]) data[rowNum] = [];
            data[rowNum].push(this.instanceData[rowNum][colNum])
        });

        return Object.values(data);
    }

    /**
     * Prepare data (add empty value in short columns) and set copy data in the instance
     * @param {Array} data
     * @private
     */
    _prepareData(data) {
        let countCols = data.reduce((max, arr) => max > arr.length ? max : arr.length, 0);
        data.forEach(col => {
            col = col.map(cell => helper.prepareValue(cell)); // copy and clear array
            while (countCols > col.length) col.push('');
            this.instanceData.push(col);
        });
        return this;
    }

    /**
     * Prepare header table
     * @param {Array} header
     * @private
     */
    _prepareHeader(header) {
        if (!header || !header.length) {
            this.instanceHeader = [];
            return;
        }
        while (this.instanceData[0].length > header.length) header.push('');
        header.length = this.instanceData[0].length;
        this.instanceHeader = header;
    }

    /**
     * Create table row
     * @param index
     * @param rowData
     * @param render
     * @returns {HTMLElement}
     * @private
     */
    _createRow({index = -1, rowData = [], render = false}) {
        if (!this.dom.rows) {
            this.dom.rows = {}
        }
        let nextTr = this.dom.rows[index],
            tableBody = this.dom.body,
            length = this.instanceData.length ? this.instanceData[0].length : this.instanceHeader.length,
            rowsClass = this.config.rowsClass,
            colsClass = this.config.colsClass;

        let tr = helper.createElement({tagName: 'tr', selector: colsClass});

        for (let colNum = 0; colNum < length; colNum++) {
            let cell = rowData[colNum] != null ? helper.prepareValue(rowData[colNum]) : '',
                td = helper.createElement({tagName: 'td', selector: rowsClass, parent: tr, html: cell});
            td.dataset.metaKey = `btk${helper.randKey()}`
        }

        if (nextTr) {
            let rowsIndexes = Object.keys(this.dom.rows),
                tmp = {};
            rowsIndexes.forEach(rowIndex => {
                rowIndex = parseFloat(rowIndex);
                if (rowIndex < index) {
                    tmp[rowIndex] = this.dom.rows[rowIndex]
                } else if (rowIndex === +index) {
                    tmp[index] = tr;
                    tmp[rowIndex + 1] = this.dom.rows[rowIndex]
                } else {
                    tmp[rowIndex + 1] = this.dom.rows[rowIndex]
                }
            });
            this.dom.rows = tmp
        } else {
            this.dom.rows[index] = tr
        }

        if (!render) return tr;

        if (nextTr) {
            tableBody.insertBefore(tr, nextTr)
        } else {
            tableBody.appendChild(tr);
        }

        return tr
    }

    /**
     * AddNew row in table
     * @return {BomTable}
     */
    addRow() {
        let index = this.lastSelected ? this.lastSelected.rowNum : this.instanceData.length;
        this._createRow({index, render: true});

        Object.keys(this.dataMap).forEach(key => {
            this.dataMap[key].classList.remove('area');
        });

        this._removeSquare();
        return this._reindex();
    }

    /**
     * Add new col
     * @return {BomTable}
     */
    addCol() {
        let num = this.lastSelected && this.lastSelected.colNum,
            lastColIndex,
            it = 0,
            rowsClass = this.config.rowsClass || '';

        if (num) {
            Object.keys(this.dataMap).forEach(key => {
                if (!key.indexOf(`${num}::`)) {
                    let el = this.dataMap[key],
                        parent = el.parentElement,
                        isHeader = key.indexOf('-1') > -1,
                        child = isHeader ? this._createHeaderCell() : helper.createElement({tagName: 'td'});

                    !isHeader && (child.dataset.metaKey = `btk${helper.randKey()}`);
                    rowsClass && !isHeader && child.classList.add(rowsClass);
                    parent.insertBefore(child, el.nextSibling);
                }
            });
        } else {
            if (this.dom.header) {
                this.dom.header.firstChild.appendChild(this._createHeaderCell());
            }
            lastColIndex = this.instanceData[0].length - 1;
            while (it !== this.instanceData.length) {
                let td = helper.createElement({
                    tagName: 'td',
                    selector: rowsClass,
                    parent: this.dataMap[`${lastColIndex}::${it++}`].parentElement
                });
                td.dataset.metaKey = `btk${helper.randKey()}`
            }
        }

        return this._reindex();
    }

    /**
     * Remove get rows or selected rows
     * @param {Array} [nums] - index removes rows, if array is empty - selected rows be removed
     * @return {BomTable}
     */
    removeRows(nums = []) {
        let rows = nums.length ? nums : this.selectedRows;

        rows.forEach(rowNum => {
            let firstTd = this.dataMap[`0::${rowNum}`],
                parentTr = firstTd && firstTd.parentNode;
            if (!parentTr) return;
            helper._likeArray(parentTr.children).forEach(td => {
                delete this.cellMeta[td.dataset.metaKey]
            });
            helper.removeElement(parentTr);
        });

        return this._reindex();
    }


    /**
     * Remove get cols or selected cols
     * @param {Array} [nums] - index removes cols, if array is empty - selected cols be removed
     * @return {BomTable}
     */
    removeCols(nums = []) {
        let cols = nums.length ? nums : this.selectedCols;

        cols.forEach(colNum => {
            Object.keys(this.dataMap).forEach(key => {
                if (!key.indexOf(`${colNum}::`)) {
                    let el = this.dataMap[key],
                        header = this.dataMap[`${colNum}::-1`];
                    el && (delete this.cellMeta[el.dataset.metaKey]);
                    el && helper.removeElement(el);
                    header && helper.removeElement(header);
                }
            });
        });

        return this._reindex();
    }

    /**
     * Union cols
     * @param {Array} [nums] - index removes cols, if array is empty - selected cols be removed
     * @return {BomTable}
     */
    unionCols(nums = []) {
        let cols = nums.length ? nums : this.selectedCols;

        if (cols.length === 1) return this;

        let firstColNum = cols.shift(),
            header = this.header.filter((h, num) => !cols.includes(num)),
            data = this.data;

        data.forEach((row, rowNum) => {
            let firstVal = '',
                newRow = [];
            row.forEach((cell, colNum) => {
                cell = cell ? cell.toString().trim() : '';

                if (cols.includes(colNum) && firstVal !== cell) {
                    if (!newRow[firstColNum]) newRow[firstColNum] = '';
                    newRow[firstColNum] += ' ' + cell;
                }

                if (cell && firstColNum === colNum) {
                    firstVal = cell;
                }

                !cols.includes(colNum) && newRow.push(cell);
            });

            data[rowNum] = newRow;
        });

        this.config.data = data;
        this.config.header = header;
        this.clear()._render();
    }

    /**
     * Get index of selected rows
     * @return {[]}
     */
    get selectedRows() {
        let rows = {};
        this.selectedMap.forEach(key => {
            rows[key.split('::')[1]] = 1;
        });
        return Object.keys(rows).map(r => +r);
    }

    /**
     * Get index of selected cols
     * @return {[]}
     */
    get selectedCols() {
        let cols = {};
        this.selectedMap.forEach(key => {
            cols[key.split('::')[0]] = 1;
        });
        return Object.keys(cols).map(c => +c);
    }

    /**
     * Public render
     * @return {BomTable}
     */
    render() {
        let renders = this.config.renders;

        this.instanceData.forEach((row, rowNum) => {
            row.forEach((cell, colNum) => {
                let td = this.dataMap[`${colNum}::${rowNum}`],
                    meta = (td.dataset.metaKey && this.cellMeta[td.dataset.metaKey]) || {};
                if (td.innerHTML !== cell) {
                    td.innerHTML = cell
                }
                renders && renders(this, td, colNum, rowNum, row[colNum], meta);
            });
        });

        this.instanceHeader.forEach((cell, colNum) => {
            let th = this.dataMap[`${colNum}::-1`],
                childWrap = helper._likeArray(th.children).find(c => c.classList.contains('bomtable-header-cell-wrap')),
                val = childWrap ? childWrap.innerHTML : th.innerHTML;
            if (cell !== val) {
                childWrap ? childWrap.innerHTML = val : th.innerHTML = val;
            }
        });

        return this._rerenderActiveArea()
    }

    /**
     * Create new index DOM
     * @return {BomTable}
     * @private
     */
    _reindex() {
        let renders = this.config.renders;

        this.dataMap = {};
        this.instanceData = [];

        this.instanceHeader = [];

        if (this.dom.header && this.dom.header.firstElementChild) {
            helper._likeArray(this.dom.header.firstElementChild.children).forEach((th, colNum) => {
                let childWrap = helper._likeArray(th.children).find(c => c.classList.contains('bomtable-header-cell-wrap')),
                    val = childWrap ? childWrap.innerHTML : th.innerHTML;
                this.instanceHeader.push(val);
                this.dataMap[`${colNum}::-1`] = th;
            });
        }

        if (this.dom.body && this.dom.body.children) {
            helper._likeArray(this.dom.body.children).forEach((tr, rowNum) => {
                this.instanceData[rowNum] = [];

                helper._likeArray(tr.children).forEach((td, colNum) => {
                    let val = td.innerHTML,
                        meta = (td.dataset.metaKey && this.cellMeta[td.dataset.metaKey]) || {};
                    this.dataMap[`${colNum}::${rowNum}`] = td;
                    this.instanceData[rowNum].push(val);
                    renders && renders(this, td, colNum, rowNum, val, meta);
                });
            });
        }

        return this;
    }

    /**
     * Render table
     * @return {BomTable}
     * @private
     */
    _render() {
        let renders = this.config.renders;

        this.dom.table = helper.createElement({tagName: 'table', selector: 'bomtable'});
        this.config.tableClass && this.dom.table.classList.add(this.config.tableClass);

        this._prepareData(this.config.data)._renderHeader();

        this.dom.body = helper.createElement({tagName: 'tbody', parent: this.dom.table});

        this.instanceData.forEach((row, rowNum) => {
            let tr = this._createRow({index: rowNum, rowData: row, render: true});
            tr.childNodes.forEach((td, colNum) => {
                renders && renders(this, td, colNum, rowNum, row[colNum], {});
                this.dataMap[`${colNum}::${rowNum}`] = td;
            })
        });

        if (!this.dom.wrapper) {
            this._container =
                typeof this.config.container === 'string'
                    ? d.querySelector(this.config.container)
                    : this.config.container;

            this.dom.wrapper = helper.createElement({
                tagName: 'div',
                selector: 'bomtable-wrapper',
                parent: this._container
            });

            this.isTouch && this.dom.wrapper.classList.add('touched');

            this.dom.wrapper.appendChild(this.dom.table);

            this._container.style.position = 'relative';
        }

        return this;
    }

    /**
     * Render table header
     * @return {BomTable}
     * @private
     */
    _renderHeader() {
        this._prepareHeader(this.config.header);

        if (!this.dom.header && this.instanceHeader.length) {
            this.dom.header = helper.createElement({tagName: 'thead'});
            helper.createElement({tagName: 'tr', parent: this.dom.header});
        }

        this.instanceHeader.forEach((cell, colNum) => {
            this.dataMap[`${colNum}::-1`] = this._createHeaderCell(cell);
        });

        if (!this.dom.header) {
            this.removeHeader();
        }

        if (this.dom.header) {
            this.dom.table.appendChild(this.dom.header);
            this.dom.table.classList.remove('bomtable-no-header');
        } else {
            this.dom.table.classList.add('bomtable-no-header');
        }

        return this
    }

    /**
     * create header cell
     * @param value
     * @returns {HTMLElement}
     * @private
     */
    _createHeaderCell(value = '') {
        let th = helper.createElement({tagName: 'th', parent: this.dom.header.firstElementChild});

        if (this.config.headerMenu) {
            let wrap = helper.createElement({tagName: 'div', selector: 'bomtable-header-cell-wrap', parent: th});
            helper.createElement({tagName: 'button', selector: 'bomtable-header-cell-btn', parent: th});
            wrap.innerHTML = value;
        } else {
            th.innerHTML = value;
        }

        return th
    }

    /**
     * Remove table header
     * @return {BomTable}
     */
    removeHeader() {
        this.dom.header && helper.removeElement(this.dom.header);
        this.dom.header = null;
        return this;
    }

    /**
     * Create context menu
     * @param {MouseEvent} e
     * @return {BomTable}
     */
    createContextMenu(e) {

        let wrapPos = this._getWrapTopLeftPosition();
        instance._createMenu(e, 'contextMenu');

        if (instance.config.contextMenu) {
            instance.dom.contextMenu.style.display = 'block';
            instance.dom.contextMenu.style.left = e.pageX - wrapPos.left - w.pageXOffset + 'px';
            instance.dom.contextMenu.style.top = e.pageY - wrapPos.top - w.pageYOffset + 'px';
        }

        return instance;
    }

    /**
     * Close menu
     * @param {MouseEvent} e
     * @return {BomTable}
     */
    closeContextMenu(e) {
        let colNum = instance.lastSelected ? instance.lastSelected.colNum : null,
            rowNum = instance.lastSelected ? instance.lastSelected.rowNum : null,
            lastSelected = {colNum, rowNum};

        return instance._closeMenu(e, 'contextMenu', lastSelected);
    }


    /**
     * Create header menu
     * @param {MouseEvent} e
     * @returns {BomTable}
     */
    createHeaderMenu(e) {
        let el = e.target,
            wrapPos = this._getWrapTopLeftPosition(),
            btnRect = el.getBoundingClientRect();

        instance.dom.contextMenu = instance._createMenu(e, 'headerMenu');

        el.parentNode.classList.add('active');

        if (instance.config.headerMenu) {
            instance.dom.headerMenu.style.left = btnRect.left - wrapPos.left + 'px';
            instance.dom.headerMenu.style.top = btnRect.bottom - wrapPos.top + 'px';
        }

        return instance;
    }

    /**
     * Close header menu
     * @param e {MouseEvent}
     * @return {BomTable}
     */
    closeHeaderMenu(e) {

        let lastSelected = {colNum: 0, rowNum: -1};
        Object.keys(instance.dataMap)
            .forEach(key => {
                let el = this.dataMap[key];
                if (key.indexOf('-1') === -1 || !el.classList.contains('active')) return;
                el.classList.remove('active');
                lastSelected.colNum = BomTable._splitKey(key)[0];
            });

        return instance._closeMenu(e, 'headerMenu', lastSelected);
    }

    /**
     * Create context or header menu
     * @param e {MouseEvent}
     * @param menuName {String}
     * @return {BomTable}
     * @private
     */
    _createMenu(e, menuName) {
        let html = '',
            className;

        if (instance.config[menuName]) {
            e.preventDefault();

            let data = {list: Object.assign({}, instance.config[menuName].items)},
                hookName = `before${helper.firstCharToUp(menuName)}Render`;

            if (instance.config.hooks[hookName]) {
                instance.config.hooks[hookName](instance, data.list)
            }
            Object.keys(data.list).forEach(key => {

                if (/^hr+[0-9]*$/.test(key)) {
                    html += `<li class="bomtable-hr"></li>`;
                } else {
                    className = helper.camelCaseToKebabCase(key);
                    html += `<li data-action="${key}" class="${className}">${instance.config[menuName].items[key]}</li>`;
                }

            });

            if (!instance.dom[menuName]) {
                instance.dom[menuName] = helper.createElement({
                    tagName: 'ul',
                    selector: `bomtable-${helper.camelCaseToKebabCase(menuName)}`,
                    parent: instance.dom.wrapper
                });
            }

            instance.dom[menuName].innerHTML = html;
        }

        return instance;
    }

    /**
     * Close context or header menu
     * @param e {MouseEvent}
     * @param menuName {String}
     * @param lastSelected {Object}
     * @returns {BomTable}
     * @private
     */
    _closeMenu(e, menuName, lastSelected) {
        let el = e && e.target,
            action;

        if (el && !e.button && instance.dom[menuName] && instance.dom[menuName].children &&
            helper._likeArray(instance.dom[menuName].children).some(li => li === el)) {

            action = el.dataset.action;

            if (instance.config[menuName].callback) {
                instance.config[menuName].callback(action, instance, e, lastSelected);
            } else if (instance[action]) {
                instance[action]();
            } else {
                throw new Error(`Undefined action ${action}`);
            }
        }

        instance.dom[menuName] && helper.removeElement(instance.dom[menuName]);
        instance.dom[menuName] = null;

        return instance;
    }

    /**
     * **** events ****
     */

    /**
     * Mouse down listener
     * @param {MouseEvent}  e
     * @private
     */
    _onmousedown(e) {
        if (instance.destroyed) return;

        let el = e.target;

        if (instance.isTouch) {
            instance.countTouch++;

            if (instance.tapped === el) {
                instance._ondblclick(e);
                e.preventDefault();
                clearTimeout(instance.tapTimeout);
                instance.tapped = false;
                return false;
            } else {
                instance.tapped = el;
                instance.tapTimeout = setTimeout(() => {
                    instance.tapped = false;
                }, 500)
            }

        }

        if (instance.input && el === instance.input.el) return;

        instance._removeInput(!instance.isTouch);

        instance.closeContextMenu(e);

        if (!helper.parents(el).some(p => p === instance.dom.table)) {
            if (instance.dom.square && instance.dom.square === el) {
                instance.squarePressed = 1;
                instance.mouseBtnPressed = 1;
            } else {
                instance.clearActiveArea();
                instance._removeSquare();
            }
            return;
        }

        instance.mouseBtnPressed = 1;

        instance._removeSquare();

        helper
            .parents(el)
            .some(p => {
                if (p.tagName === 'TH') {
                    el = p;
                    return true;
                }
            });

        if (!helper.isTableCell(el)) return;

        // left click on select area
        if (e.button && instance.selected.some(key => instance.dataMap[key] === el)) return;

        instance._setActiveCell(e, el);

    }

    /**
     * Mouse up listener
     * @param {MouseEvent}  e
     * @private
     */
    _onmouseup(e) {
        if (instance.destroyed) return;

        let el = e.target;
        if (instance.isTouch) {
            instance.countTouch--;
        }
        instance.mouseBtnPressed = 0;
        instance.squarePressed = 0;

        if (e.which === 1 &&
            el.classList.contains('bomtable-header-cell-btn') &&
            !el.parentNode.classList.contains('active')) {
            instance.closeHeaderMenu(e);
            instance.createHeaderMenu(e);
        } else {
            instance.closeHeaderMenu(e);
        }

        instance._removeCopyArea();
    }

    /**
     * Touch move listener
     * @param {MouseEvent} e
     * @private
     */
    _ontouchmove(e) {
        if (instance.destroyed) return;

        if (!instance.mouseBtnPressed || instance.countTouch > 1) return true;
        e.preventDefault();

        let touch = e.targetTouches[0],
            windowYScroll = w.pageYOffset,
            el = null, X = touch.pageX, Y = touch.pageY;

        // find hover element
        Object.keys(instance.dataMap).some(key => {

            let i = instance.dataMap[key],
                rect = i.getBoundingClientRect(),
                isHover = rect.left < X && windowYScroll + rect.top < Y &&
                    rect.left + rect.width > X && windowYScroll + rect.top + rect.height > Y;

            if (isHover) {
                el = i;
                return true;
            }
        });

        if (!el || instance.lastHover === el) return;

        if (!helper.isTableCell(el)) return;

        instance.lastHover = el;

        if (!instance.squarePressed) {
            instance._setActiveCell(e, el);
        } else if (el.tagName === 'TD') {
            instance._squareAreaListener(e, el);
        }

    }

    /**
     * Mouse over listener
     * @param {MouseEvent} e
     * @private
     */
    _onmouseover(e) {
        if (instance.destroyed) return;

        let el = e.target;

        if (!instance.mouseBtnPressed || !helper.isTableCell(el)) return;

        !instance.squarePressed && instance._setActiveCell(e);
    }

    /**
     * Mouse move listener
     * @param {MouseEvent} e
     * @private
     */
    _onmousemove(e) {
        if (instance.destroyed) return;

        let el = e.target;
        if (!instance.mouseBtnPressed || instance.lastHover === el) return;

        instance.lastHover = el;

        if (instance.squarePressed && el.tagName === 'TD') {
            instance._squareAreaListener(e);
        }
    }

    /**
     * On mouse double click listener
     * @param {MouseEvent} e
     * @private
     */
    _ondblclick(e) {
        if (instance.destroyed) return;

        let el = e.target;

        if (el.tagName !== 'TD') {
            return;
        }

        instance._setActiveCell(e);

        instance._createInput();
    }

    /**
     * Context menu listener
     * @param {MouseEvent} e
     * @private
     */
    _oncontextmenu(e) {
        if (instance.destroyed) return;

        let el = e.target;

        if (!helper.parents(el).some(p => p === instance._container)) {
            return;
        }

        instance.createContextMenu(e);
    }

    /**
     * On key down listener
     * @param {KeyboardEvent} e
     * @private
     */
    _keyDownWatcher(e) {
        if (instance.destroyed) return;

        if (instance.mouseBtnPressed && e.key === 'Escape' && instance.dom.copyAreaLeft) {
            instance._removeCopyArea(false);
            return;
        }

        let el = instance.input && instance.input.el,
            data,
            key = e.key,
            val = el && el.value,
            colNum = instance.lastSelected && instance.lastSelected.colNum,
            rowNum = instance.lastSelected && instance.lastSelected.rowNum,
            totalCols = instance.instanceData[0].length - 1,
            totalRows = instance.instanceData.length - 1,
            moveSelect = false, // признак движения выделения клавишами
            map = {start: {colNum, rowNum}, end: {colNum, rowNum}},
            keyMustIgnore = BomTable._keysIgnore(key);

        if (e.ctrlKey && !el && key.toLowerCase() !== 'a') {
            instance._createBuffer();
        }

        el && e.stopPropagation();

        if (key === 'Tab') {
            key = 'ArrowRight'
        }

        if (instance.selected.length > 1 && instance.mouseDownElement && key.substr(0, 5) === 'Arrow') {
            rowNum = map.start.rowNum = map.end.rowNum = instance.mouseDownElement.rowNum;
            colNum = map.start.colNum = map.end.colNum = instance.mouseDownElement.colNum;
        }

        switch (key) {
            case 'ArrowLeft':
                // cursor move inside input
                if (el && el.selectionStart !== 0) {
                    return;
                }
                if (colNum > 0) {
                    moveSelect = true;
                    map.start.colNum = map.end.colNum = colNum - 1;
                }
                if (!colNum) {
                    moveSelect = true;
                    if (!rowNum) rowNum = totalRows + 1;
                    map.start.rowNum = map.end.rowNum = rowNum - 1;
                    map.start.colNum = map.end.colNum = totalCols;
                }
                break;
            case 'ArrowRight':
                // cursor move inside input
                if (el && el.selectionEnd < val.length) {
                    return;
                }
                if (totalCols === colNum) {
                    moveSelect = true;
                    if (rowNum === totalRows) rowNum = -1;
                    map.start.colNum = map.end.colNum = 0;
                    map.start.rowNum = map.end.rowNum = rowNum + 1;
                }
                if (totalCols > colNum) {
                    moveSelect = true;
                    map.start.colNum = map.end.colNum = colNum + 1;
                }
                break;
            case 'ArrowUp':
                if (rowNum > 0) {
                    moveSelect = true;
                    map.start.rowNum = map.end.rowNum = rowNum - 1;
                }
                if (!rowNum) {
                    moveSelect = true;
                    if (!colNum) colNum = totalCols + 1;
                    map.start.rowNum = map.end.rowNum = totalRows;
                    map.start.colNum = map.end.colNum = colNum - 1;
                }
                break;
            case 'ArrowDown':
                if (totalRows > rowNum) {
                    moveSelect = true;
                    map.start.rowNum = map.end.rowNum = rowNum + 1;
                }
                if (rowNum === totalRows) {
                    moveSelect = true;
                    if (colNum === totalCols) colNum = -1;
                    map.start.rowNum = map.end.rowNum = 0;
                    map.start.colNum = map.end.colNum = colNum + 1;
                }
                break;
            case 'Enter':
                el ? instance._removeInput() : instance._createInput();
                e.preventDefault();
                break;
            case 'Escape':
                instance.mouseBtnPressed = 0;
                instance.squarePressed = 0;
                instance._removeInput(false);
                break;
            case 'Delete':
                if (!el) {
                    instance.selectedMap.forEach(key => {
                        let [col, row] = BomTable._splitKey(key);
                        instance.dataMap[`${col}::${row}`] && (instance.dataCell = {col, row, val: ''});
                    });
                    keyMustIgnore = true;
                    instance._rerenderActiveArea();
                }
                break;
        }

        // ctrl + a
        if (!el && e.ctrlKey && key === 'A') {
            moveSelect = false;
            data = instance.data;
            map.start.rowNum = 0;
            map.start.colNum = 0;

            map.end.rowNum = data.length - 1;
            map.end.colNum = data[0].length - 1;
            instance._setActiveArea(map);
        }

        // need move active area
        if (moveSelect) {
            e.preventDefault();
            instance._removeInput();
            instance._setActiveArea(map);
        } else if (!el && !e.ctrlKey && !e.shiftKey && !keyMustIgnore && !instance.mouseBtnPressed) {
            instance._createInput(false)
        }

        instance.closeContextMenu(e);
    }

    /**
     * On paste listener
     * @param {KeyboardEvent} e
     * @private
     */
    _onPaste(e) {
        if (instance.destroyed) return;

        e.stopPropagation();
        e.preventDefault();

        let
            tmp = [],
            selectedArea = [],
            pasteData = (e.clipboardData || window.clipboardData).getData('Text'),
            selectedCols = instance.selectedCols,
            selectedRows = instance.selectedRows,
            oneSelected = selectedCols.length === selectedRows.length && selectedRows.length === 1;

        selectedRows.forEach(r => {
            let row = [];
            selectedCols.forEach(c => row.push(`${c}::${r}`));
            selectedArea.push(row);
        });

        pasteData = pasteData.split('\n');

        pasteData.forEach(row => {
            tmp.push(row.split('\t'));
        });
        pasteData = tmp;

        if (selectedArea.length > pasteData.length) {
            let index = 0,
                lengthPasteData = pasteData.length;
            while (selectedArea.length > pasteData.length) {
                pasteData.push(pasteData[index++]);
                if (index === lengthPasteData) index = 0;
            }
        } else if (oneSelected && pasteData.length > selectedArea.length) {
            let lastRowIndex = selectedRows[selectedRows.length - 1];
            while (pasteData.length > selectedArea.length) {
                let nextRow = [];
                lastRowIndex++;
                selectedCols.forEach(c => {
                    nextRow.push(`${c}::${lastRowIndex}`)
                });
                selectedArea.push(nextRow);
            }
        }

        if (selectedArea[0].length > pasteData[0].length) {
            pasteData.forEach(row => {
                let index = 0,
                    lengthPasteData = pasteData[0].length;
                while (selectedArea[0].length > row.length) {
                    row.push(row[index++]);
                    if (index === lengthPasteData) index = 0;
                }
            });
        } else if (oneSelected && pasteData[0].length > selectedArea[0].length) {
            let lastColIndex = selectedCols[selectedCols.length - 1];
            while (pasteData[0].length > selectedArea[0].length) {
                lastColIndex++;
                selectedArea.forEach(r => {
                    r.push(`${lastColIndex}::${r[0].split('::')[1]}`);
                });
            }
        }

        let map = {start: {}, end: {}};

        selectedArea.forEach((row, rowIndex) => {
            row.forEach((key, colIndex) => {
                let [colNum, rowNum] = BomTable._splitKey(key);

                if (map.start.colNum == null || map.start.colNum > colNum) map.start.colNum = colNum;
                if (map.start.rowNum == null || map.start.rowNum > rowNum) map.start.rowNum = rowNum;

                if (map.end.colNum == null || colNum > map.end.colNum) map.end.colNum = colNum;
                if (map.end.rowNum == null || rowNum > map.end.rowNum) map.end.rowNum = rowNum;

                instance.dataMap[`${colNum}::${rowNum}`] && (instance.dataCell = {
                    col: colNum,
                    row: rowNum,
                    val: pasteData[rowIndex][colIndex]
                });
            });
        });

        instance._setActiveArea(map);
    }

    /**
     * Create copy/paste buffer and set focus
     * @private
     */
    _createBuffer() {
        let str = [];

        if (!this.dom._buffer) {
            this.dom._buffer = helper.createElement({
                tagName: 'textarea',
                selector: 'bomtable-buffer',
                parent: this.dom.wrapper
            });
            this.dom._buffer.addEventListener('paste', this._onPaste);
        }

        this.selectedData.forEach(row => {
            str.push(row.join('\t'));
        });

        this.dom._buffer.value = str.join('\n');

        this.dom._buffer.select();
        this.dom._buffer.focus();
    }

    /**
     * Set active cell
     * @param {MouseEvent} e - event
     * @param {HTMLElement|null} el - target over element
     * @return {{el: HTMLElement, colNum: number, rowNum: number}}
     */
    _setActiveCell(e, el = null) {

        let type = e.type,
            keyType = 'none';

        if (!el) el = e.target;

        if (e.shiftKey) {
            keyType = 'shiftKey'
        } else if (e.ctrlKey) {
            keyType = 'ctrlKey'
        }

        helper.clearSelected();

        let [colNum, rowNum] = BomTable._splitKey(Object.keys(this.dataMap)
            .find(key => this.dataMap[key] === el));

        if (['mousedown', 'touchstart'].includes(type)) {
            this.mouseDownElement = {el, colNum, rowNum};
        }

        this.mouseDownElement && this._setActiveArea({
            start: {
                colNum: this.mouseDownElement.colNum,
                rowNum: this.mouseDownElement.rowNum,
            },
            end: {
                colNum,
                rowNum,
            }
        }, keyType);

        return this._setLastSelected(el, colNum, rowNum);
    }

    /**
     * Save last selected cell
     * @param {HTMLElement} el
     * @param {number} colNum
     * @param {number} rowNum
     * @return {undefined|{el: *, colNum: *, rowNum: *}}
     * @private
     */
    _setLastSelected(el, colNum, rowNum) {
        if (this.lastSelected && this.lastSelected.el === el) return;

        return this.lastSelected = {el, colNum, rowNum};
    }

    /**
     * Save and mark active area
     * @param {object} map {start: {colNum, rowNum}, end: {colNum, rowNum}}
     * @param {string} keyType - 'shiftKey' | 'ctrlKey' | 'none'
     * @return {BomTable}
     * @private
     */
    _setActiveArea(map, keyType = 'none') {

        if (this.destroyed) return this;

        let startCol = map.start.colNum,
            endCol = map.end.colNum,
            startRow = map.start.rowNum,
            endRow = map.end.rowNum,
            mouseDownEl = this.mouseDownElement.el,

            rows = [],
            cols = [];

        // if press shift key
        if (keyType === 'shiftKey' && this.lastSelected) {
            if (this.lastSelected.rowNum > startRow) {
                endRow = this.lastSelected.rowNum;
            } else {
                startRow = this.lastSelected.rowNum;
            }
            if (this.lastSelected.colNum > startCol) {
                endCol = this.lastSelected.colNum;
            } else {
                startCol = this.lastSelected.colNum;
            }
        }

        // clear selected
        ['shiftKey', 'none'].includes(keyType) && this.clearActiveArea();

        // revert if right to left
        if (startCol > endCol) {
            startCol = map.end.colNum;
            endCol = map.start.colNum;
        }

        // revert if down to up
        if (startRow > endRow) {
            startRow = map.end.rowNum;
            endRow = map.start.rowNum;
        }

        if (map.start.rowNum !== -1 && startRow === -1) {
            startRow = 0
        }
        // array rows
        for (let i = startRow; endRow >= i; i++) {
            rows.push(i);
        }

        // select only headers
        if (rows.length === 1 && rows[0] === -1) {
            // total rows length
            endRow = this.instanceData.length - 1;
            // select all rows
            rows = [];
            for (let i = 0; endRow >= i; i++) {
                rows.push(i);
            }
        }

        // array cols
        for (let i = startCol; endCol >= i; i++) {
            cols.push(i);
        }

        cols.forEach(col => {
            rows.forEach(row => {
                if (row === -1) return;
                let key = `${col}::${row}`,
                    el = this.dataMap[key];
                if (this.selected.includes(key)) {
                    this.selected = this.selected.filter(s => s !== key);
                } else {
                    this.selected.push(key);
                }

                if (mouseDownEl === el && (cols.length > 1 || rows.length > 1)) {
                    el.classList.remove('area');
                } else {
                    el.classList.toggle('area');
                }
            })
        });

        if (this.selected.length === 1) {
            let chunks = BomTable._splitKey(this.selected[0]);
            this._setLastSelected(this.dataMap[this.selected[0]], chunks[0], chunks[1]);
        }

        this.lastSelectArea = {start: {col: startCol, row: startRow}, end: {col: endCol, row: endRow}};
        this._createSquare(endCol, endRow);

        this._addSquareArea(this._ariaPosition({startCol, startRow, endCol, endRow}), 'activeArea');

        return this;
    }

    /**
     * Position of area
     * @param {Number} startCol
     * @param {Number} startRow
     * @param {Number} endCol
     * @param {Number} endRow
     * @param {Number} borderWidth - border width
     * @returns {{top: number, left: number, bottom: number, right: number}}
     * @private
     */
    _ariaPosition({startCol, startRow, endCol, endRow}, borderWidth = 1) {
        let borderHalf = Math.ceil(borderWidth / 2),
            firstTd = this.dataMap[`${startCol}::${startRow}`],
            firstRect = firstTd.getBoundingClientRect(),
            lastTd = this.dataMap[`${endCol}::${endRow}`],
            lastRect = lastTd.getBoundingClientRect();

        return {
            left: firstRect.left - (!startCol ? 0 : borderHalf),
            top: firstRect.top - (startRow === -1 ? 0 : borderHalf),
            bottom: lastRect.bottom - borderHalf,
            right: lastRect.right - borderHalf
        }
    }

    /**
     * Rerender active area square and draggable square
     * @returns {BomTable}
     * @private
     */
    _rerenderActiveArea() {
        if (!Object.keys(this.lastSelectArea).length) return this;
        let area = this.lastSelectArea,
            startCol = area.start.col,
            startRow = area.start.row,
            endCol = area.end.col,
            endRow = area.end.row;
        return this
            ._addSquareArea(this._ariaPosition({startCol, startRow, endCol, endRow}), 'activeArea')
            ._createSquare(endCol, endRow);
    }

    /**
     * Clear active area
     * @return {BomTable}
     */
    clearActiveArea() {

        if (!this.dom.activeAreaLeft) return this;

        this._removeSquareArea('activeArea');

        this.dom.activeAreaLeft = this.dom.activeAreaRight = this.dom.activeAreaTop = this.dom.activeAreaBottom = null;

        this.instanceData.length && this.selectedMap.forEach(key => {
            let el = this.dataMap[key];
            el && el.classList.remove('area');
        });

        this.lastSelectArea = {};
        this.selected = [];
        this.lastSelected = null;

        return this;
    }

    /**
     * Get container top and lEft position
     * @return {{}}
     * @private
     */
    _getWrapTopLeftPosition() {
        let cont = this._container,
            rect = cont.getBoundingClientRect(),
            css = w.getComputedStyle(cont);

        return {
            top: rect.top + -cont.scrollTop + helper.getNumberFromString(css.paddingTop),
            left: rect.left - cont.scrollLeft + helper.getNumberFromString(css.paddingLeft)
        };
    }

    /**
     * Create draggable square
     * @param {number} endCol - end col
     * @param {number} endRow - end row
     * @return {BomTable}
     * @private
     */
    _createSquare(endCol, endRow) {
        let downRightTd = this.dataMap[`${endCol}::${endRow}`],
            wrapPos = this._getWrapTopLeftPosition(),
            rect = downRightTd.getBoundingClientRect();

        if (downRightTd.tagName !== 'TD') return this;

        if (!this.dom.square) {
            this.dom.square = helper.createElement({
                tagName: 'div',
                selector: 'bomtable-square',
                parent: this.dom.wrapper
            });
        }

        this.dom.square.style.top = rect.bottom - wrapPos.top + 'px';
        this.dom.square.style.left = rect.right - wrapPos.left + 'px';

        return this;
    }

    /**
     * Remove square
     * @return {BomTable}
     * @private
     */
    _removeSquare() {
        this.dom.square && helper.removeElement(this.dom.square);
        this.dom.square = null;
        return this;
    }

    /**
     * Listener move square
     * @param {MouseEvent} e
     * @param {HTMLElement|null} el - target over element
     * @private
     */
    _squareAreaListener(e, el = null) {

        if (!el) el = e.target;

        let bottomRightSelectTr = this.dataMap[`${this.lastSelectArea.end.col}::${this.lastSelectArea.end.row}`],
            rectBRSTr = bottomRightSelectTr.getBoundingClientRect(),
            elMap = {},
            startCol, endCol, startRow, endRow,
            touch = this.isTouch && e.targetTouches[0],
            X = this.isTouch ? touch.pageX : e.pageX,
            Y = this.isTouch ? touch.pageY : e.pageY;

        this.direction = {};

        Object.keys(this.dataMap).some(key => {
            let td = this.dataMap[key],
                splitKey;

            if (td !== el) return false;

            splitKey = BomTable._splitKey(key);
            elMap.col = splitKey[0];
            elMap.row = splitKey[1];

            return true;
        });

        endCol = elMap.col;
        endRow = elMap.row;

        if (rectBRSTr.right + w.pageXOffset > X) { // left

            startCol = this.lastSelectArea.end.col;
            endCol = this.lastSelectArea.end.col;

            this.direction.x = 'left';

            if (startCol > elMap.col) {
                startCol = elMap.col;
            }
        } else { // right
            this.direction.x = 'right';
            startCol = this.lastSelectArea.start.col;
        }

        if (startCol > this.lastSelectArea.start.col) {
            startCol = this.lastSelectArea.start.col;
        }

        // up
        if (rectBRSTr.top + w.pageYOffset > Y) {

            startRow = this.lastSelectArea.start.row;
            endRow = this.lastSelectArea.end.row;

            this.direction.y = 'up';

            if (startRow > elMap.row) {
                startRow = elMap.row;
            }

        } else { // down
            this.direction.y = 'down';
            startRow = this.lastSelectArea.start.row;
        }

        helper.clearSelected();

        this
            ._addSquareArea(this._ariaPosition({startCol, startRow, endCol, endRow}, 3), 'copyArea')
            ._setSquareDragCell({startCol, endCol, startRow, endRow})
    }

    /**
     * Create square area contains lines, and append it to this.dom.wrapper
     * @param {Object} position - {left, top, bottom, right}
     * @param {String} name - class list and name of dom elements
     * @returns {BomTable}
     * @private
     */
    _addSquareArea(position, name) {
        let wrapPos = this._getWrapTopLeftPosition(),
            startClassName = `bomtable-${helper.camelCaseToKebabCase(name)}`;

        if (!this.dom[`${name}Left`]) {
            ['Left', 'Top', 'Right', 'Bottom'].forEach(key => {
                this.dom[`${name}${key}`] = helper.createElement({
                    tagName: 'div',
                    selector: `${startClassName}-${key.toLowerCase()}`,
                    parent: this.dom.wrapper
                });
            });
        }

        let top = position.top - wrapPos.top,
            left = position.left - wrapPos.left,
            right = position.right - wrapPos.left,
            bottom = position.bottom - wrapPos.top,
            height = position.bottom - position.top,
            width = position.right - position.left;

        this.dom[`${name}Left`].style.top = `${top}px`;
        this.dom[`${name}Left`].style.left = `${left}px`;
        this.dom[`${name}Left`].style.height = `${height}px`;

        this.dom[`${name}Right`].style.top = `${top}px`;
        this.dom[`${name}Right`].style.left = `${right}px`;
        this.dom[`${name}Right`].style.height = `${height}px`;

        this.dom[`${name}Top`].style.top = `${top}px`;
        this.dom[`${name}Top`].style.left = `${left}px`;
        this.dom[`${name}Top`].style.width = `${width}px`;

        this.dom[`${name}Bottom`].style.top = `${bottom}px`;
        this.dom[`${name}Bottom`].style.left = `${left}px`;
        this.dom[`${name}Bottom`].style.width = `${width}px`;

        return this
    }

    /**
     * Remove square area
     * @param {String} name - name of dom elements
     * @private
     */
    _removeSquareArea(name) {
        if (!this.dom[`${name}Left`]) return;
        ['Left', 'Top', 'Right', 'Bottom'].forEach(key => {
            helper.removeElement(this.dom[`${name}${key}`]);
            this.dom[`${name}${key}`] = null
        });
    }

    /**
     * Draw square
     * @param {Object} map coords {startCol, endCol, startRow, endRow}
     * @return {BomTable}
     * @private
     */
    _setSquareDragCell(map) {
        this.squareDragArea = [];

        for (let col = map.startCol; map.endCol >= col; col++) {
            for (let row = map.startRow; map.endRow >= row; row++) {
                this.squareDragArea.push(`${col}::${row}`)
            }
        }

        return this;
    }

    /**
     * Remove drag area
     * @param {boolean} saveValue - save value after remove area
     * @return {BomTable}
     * @private
     */
    _removeCopyArea(saveValue = true) {

        if (!this.dom.copyAreaLeft) return this;
        this._removeSquareArea('copyArea');

        if (saveValue && this.squareDragArea.length) {

            let tableData = {},
                squareAreaData = {},
                map = {start: {}, end: {}};

            this.selectedMap.forEach(key => {
                let rowNum = key.split('::')[1];
                if (!tableData[rowNum]) tableData[rowNum] = [];
                tableData[rowNum].push(key)
            });
            tableData = Object.values(tableData);

            this.squareDragArea.forEach(key => {
                let rowNum = +key.split('::')[1];
                if (rowNum < 0) return;
                if (!squareAreaData[rowNum]) squareAreaData[rowNum] = [];
                squareAreaData[rowNum].push(key)
            });

            squareAreaData = Object.values(squareAreaData);

            // if dif count set and selected cols or rows
            if (tableData.length !== squareAreaData.length || squareAreaData[0].length !== tableData[0].length) {

                if (squareAreaData.length > tableData.length) {

                    let index = 0,
                        lengthData = tableData.length;
                    while (squareAreaData.length > tableData.length) {
                        if (this.direction.y === 'down') {
                            tableData.push(tableData[index++]);
                            if (index === lengthData) index = 0;
                        } else {
                            tableData.unshift(tableData[tableData.length - (++index)]);
                        }
                    }

                }

                if (squareAreaData[0].length > tableData[0].length) {
                    tableData.forEach(row => {
                        let index = 0,
                            lengthData = tableData[0].length;
                        while (squareAreaData[0].length > row.length) {
                            if (this.direction.x === 'right') {
                                row.push(row[index++]);
                                if (index === lengthData) index = 0;
                            } else {
                                row.unshift(row[row.length - (++index)]);
                            }
                        }
                    });
                }

                squareAreaData.forEach((row, rowIndex) => {
                    row.forEach((key, colIndex) => {
                        let copyKey = tableData[rowIndex][colIndex],
                            [colNum, rowNum] = BomTable._splitKey(key);

                        if (map.start.colNum == null || map.start.colNum > colNum) map.start.colNum = colNum;
                        if (map.start.rowNum == null || map.start.rowNum > rowNum) map.start.rowNum = rowNum;

                        if (map.end.colNum == null || colNum > map.end.colNum) map.end.colNum = colNum;
                        if (map.end.rowNum == null || rowNum > map.end.rowNum) map.end.rowNum = rowNum;

                        if (copyKey === key) return;

                        let [colCopyNum, rowCopyNum] = BomTable._splitKey(copyKey),
                            val = this.dataCell(colCopyNum, rowCopyNum);

                        instance.dataCell = {col: colNum, row: rowNum, val};
                    })
                });

                this._setActiveArea(map);
            }

        }

        this.squareDragArea = [];
        this.direction = {};

        return this;
    }

    /**
     * Create table textarea
     * @param {boolean} setCellValue - set in input cell value (default - set)
     * @private
     */
    _createInput(setCellValue = true) {

        if (!this.lastSelected || this.lastSelected.el.tagName !== 'TD') return;

        let td = this.lastSelected.el,
            tdRect = td.getBoundingClientRect(),
            wrapPos = this._getWrapTopLeftPosition(),
            left = tdRect.left - wrapPos.left - 1,
            textarea = helper.createElement({
                tagName: 'textarea',
                selector: 'bomtable-input',
                parent: this.dom.wrapper,
                css: {
                    left: `${left}px`,
                    top: `${tdRect.top - wrapPos.top - 1}px`,
                }
            });

        textarea.addEventListener('input', this._onInput);

        if (setCellValue) {
            textarea.value = td.innerHTML;
        }

        textarea.focus();

        this.input = {el: textarea, colNum: this.lastSelected.colNum, rowNum: this.lastSelected.rowNum};
        this._createElHelper({td, left, textarea});

        return this._updateInputSize()._removeSquare();
    }

    /**
     * Update input size
     * @returns {*}
     * @private
     */
    _updateInputSize() {
        if (!instance.dom.elHelper || !instance.input) return instance;

        let elHelper = instance.dom.elHelper,
            textarea = instance.input.el,
            tdRect = instance.lastSelected.el.getBoundingClientRect();

        elHelper.innerText = `${textarea.value}.`;

        let elHelperStyles = w.getComputedStyle(elHelper),
            countLines = Math.ceil(elHelper.scrollWidth / elHelper.offsetWidth),
            height = Math.max(helper.getNumberFromString(elHelperStyles.lineHeight) * countLines, tdRect.height + 1),
            minHeight = `${height}px`,
            minWidth = `${tdRect.width + 1}px`;

        elHelper.style.minHeight = minHeight;
        elHelper.style.minWidth = minWidth;

        textarea.style.width = `${elHelper.offsetWidth}px`;
        textarea.style.minWidth = minWidth;
        textarea.style.minHeight = minHeight;
        textarea.style.height = `${elHelper.offsetHeight}px`;
        return instance
    }


    /**
     * Remove table textarea
     * @param {boolean} saveValue - save value before remove textarea
     * @private
     */
    _removeInput(saveValue = true) {

        if (!this.input) return;

        let val = this.input.el.value,
            col = this.input.colNum,
            row = this.input.rowNum;

        this.input.el.removeEventListener('input', this._onInput);

        helper.removeElement(this.input.el);
        helper.removeElement(this.dom.elHelper);

        this.input = null;

        if (!saveValue) return;
        this.dataCell = {col, row, val};
    }

    /**
     * Create helper element
     * @param {HTMLElement} td - current td element
     * @param {Number} left - left position
     * @private
     */
    _createElHelper({td, left}) {
        let textareaStyle = w.getComputedStyle(this.input.el);

        this.dom.elHelper = helper.createElement({
            tagName: 'span',
            parent: this.dom.wrapper,
            css: {
                top: 0,
                left: `${left}px`,
                position: 'absolute',

                zIndex: -1,
                opacity: 0,
                display: 'block',

                maxWidth: `${this.dom.body.offsetWidth - left}px`,
                minHeight: `${td.offsetHeight}px`,

                padding: textareaStyle.padding,

                lineHeight: textareaStyle.lineHeight,
                fontFamily: textareaStyle.fontFamily,
                fontSize: textareaStyle.fontSize,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',

                border: textareaStyle.border,
                boxSizing: textareaStyle.boxSizing,
            }
        });

    }

    /**
     * Event on change value on input
     * @private
     */
    _onInput() {
        instance._updateInputSize()
    }

    /**
     * Clear data of instance
     * @return {BomTable}
     */
    clear() {
        if (!this.dom) {
            this.dom = {};
        }

        this._removeInput(false);
        this._removeCopyArea(false);

        this.instanceData = [];
        this.instanceHeader = [];
        this.dataMap = {};
        this.cellMeta = {};

        this.countTouch = 0;
        this.tapped = false;

        this.lastSelectArea = {};
        Object.keys(this.dom).forEach(nodeName => {
            if (!this.dom[nodeName]) return;
            if (typeof this.dom[nodeName] === 'object') {
                Object.keys(this.dom[nodeName]).forEach(key => {
                    helper.removeElement(this.dom[nodeName][key]);
                    this.dom[nodeName][key] = null
                })
            }
            helper.removeElement(this.dom[nodeName]);
            delete this.dom[nodeName];
        });

        this.selected = [];
        this.lastSelected = null;

        this.lastHover = null;
        return this;
    }

    /**
     * 'destroy' and clear instance
     */
    destroy() {

        d.removeEventListener('mousedown', instance._onmousedown);
        d.removeEventListener('mouseup', instance._onmouseup);

        d.removeEventListener('mouseenter', instance._onmousemove);
        d.removeEventListener('mouseover', instance._onmouseover);

        d.removeEventListener('dblclick', instance._ondblclick);

        d.removeEventListener('keydown', instance._keyDownWatcher);

        instance.dom._buffer && instance.dom._buffer.removeEventListener('paste', instance._onPaste);

        instance.destroyed = 1;
        instance.clear();
    }
}
