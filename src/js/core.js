import * as helper from "./helper";

const
    d = document,
    w = window;

export default class Core {

    constructor(opts = {}) {

        /**
         * Config
         * @type {Object}
         */
        this.config = Object.assign({
            data: [], // data for table body
            header: '', // table header
            tableClass: '', // css class table
            container: null, // node or selector for mount table
            rowsClass: '', // css class for table rows
            colsClass: '', // css class for table cols

            // context menu
            contextMain: {
                items: {
                    addRow: 'add row',
                    addCol: 'add col',
                    hr: '',
                    removeRows: 'remove rows',
                    removeCols: 'remove cols'
                },
                callback: null // function can be call after click context menu item
            }
        }, opts);

        this._keysIgnore = [
            0, 9, 10, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45,
            91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
        ];

        return this;
    }

    /**
     * Initialization
     * @return {Core}
     */
    _ini() {

        this.clear()._render();

        return this._callListeners();
    }

    /**
     * add event listeners
     * @return {Core}
     */
    _callListeners() {

        d.addEventListener('mousedown', this._onmousedown.bind(this));
        d.addEventListener('mouseup', this._onmouseup.bind(this));

        d.addEventListener('mousemove', this._onmousemove.bind(this));
        d.addEventListener('mouseover', this._onmouseover.bind(this));

        d.addEventListener('dblclick', this._ondblclick.bind(this));
        d.addEventListener('contextmenu', this._oncontextmenu.bind(this));

        d.addEventListener('keydown', this._keyDownWatcher.bind(this));

        return this;
    }

    /**
     * Set new data
     * @param data
     */
    setData(data) {
        if (!Array.isArray(data)) throw new Error('Data must be an array');
        this.config.data = data;
        this.clear()._render();
    }

    /**
     * Get instance data
     * @return {Array}
     */
    getData() {
        return this.instanceData;
    }

    /**
     * Set new header
     * @param header
     */
    setHeader(header) {
        if (!Array.isArray(header)) throw new Error('Header must be an array');
        this.config.header = header;
        return this.clear()._render();
    }

    /**
     * Set new cell value
     * @param {number} col - col number of cell
     * @param {number} row - row number of cell
     * @param {*} val - new value
     * @return {Core}
     */
    setDataCell(col, row, val) {
        this.dataMap[`${col}::${row}`].innerHTML = val;
        this.instanceData[row][col] = val;
        return this;
    }

    /**
     * Get instance header
     * @return {Array}
     */
    getHeader() {
        return this.instanceHeader;
    }

    /**
     * Get selected map
     * @return {*|Array}
     */
    getSelected() {
        return this.selected.sort();
    }

    /**
     * get data from selected items
     * @return {Array}
     */
    getSelectedData() {
        let data = {};

        this.getSelected().forEach(key => {
            let [colNum, rowNum] = key.split('::');
            if (!data[rowNum]) data[rowNum] = [];
            data[rowNum].push(this.instanceData[rowNum][colNum])
        });

        return Object.values(data);
    }

    /**
     * Get cell value
     * @param {number} col - col number of cell
     * @param {number} row - row number of cell
     * @return {*}
     */
    getDataCell(col, row) {
        return this.instanceData[row][col];
    }

    /**
     * Prepare data (add empty value in short columns) and set copy data in instance
     * @param data
     * @private
     */
    _prepareData(data) {
        let countCols = data.reduce((max, arr) => max > arr.length ? max : arr.length, 0);
        data.forEach(col => {
            col = col.slice(0); // copy array
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
     * AddNew row in table
     * @return {Core}
     */
    addRow() {
        let nextTr = this.lastSelected && this.lastSelected.el.parentNode.nextSibling,
            tableBody = this.dom.body,
            length = this.instanceData.length ? this.instanceData[0].length : this.instanceHeader.length,
            rowsClass = this.config.rowsClass,
            colsClass = this.config.colsClass;

        let tr = d.createElement('tr');
        colsClass && tr.classList.add(colsClass);

        while (length--) {
            let td = d.createElement('td');
            rowsClass && td.classList.add(rowsClass);

            tr.appendChild(td);
        }

        if (nextTr) {
            tableBody.insertBefore(tr, nextTr)
        } else {
            this.dom.body.appendChild(tr);
        }

        return this._reindex();
    }

    /**
     * Add new col
     * @return {Core}
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
                        nodeType = key.indexOf('-1') > -1 ? 'th' : 'td',
                        child = d.createElement(nodeType);

                    rowsClass && nodeType !== 'th' && child.classList.add(rowsClass);
                    parent.insertBefore(child, el.nextSibling);
                }
            });
        } else {
            this.dom.header && helper.createElement('th', '', this.dom.header.firstChild);
            lastColIndex = this.instanceData[0].length - 1;
            while (it !== this.instanceData.length) {
                helper.createElement('td', rowsClass, this.dataMap[`${lastColIndex}::${it++}`].parentElement);
            }
        }

        return this._reindex();
    }

    /**
     * Remove get rows or selected rows
     * @param {Array} [nums] - index removes rows, if array is empty - selected rows be removed
     * @return {Core}
     */
    removeRows(nums = []) {
        let rows = nums.length ? nums : this.getSelectedRows();

        rows.forEach(rowNum => {
            let firstTd = this.dataMap[`0::${rowNum}`],
                parentTr = firstTd && firstTd.parentNode;
            if (!parentTr) return;
            helper.removeElement(parentTr);
        });

        return this._reindex();
    }


    /**
     * Remove get cols or selected cols
     * @param {Array} [nums] - index removes cols, if array is empty - selected cols be removed
     * @return {Core}
     */
    removeCols(nums = []) {
        let cols = nums.length ? nums : this.getSelectedCols();

        cols.forEach(colNum => {
            Object.keys(this.dataMap).forEach(key => {
                if (!key.indexOf(`${colNum}::`)) {
                    let el = this.dataMap[key],
                        header = this.dataMap[`${colNum}::-1`];
                    el && helper.removeElement(el);
                    header && helper.removeElement(header);
                }
            });
        });

        return this._reindex();
    }

    /**
     * Get index of selected rows
     * @return {Array}
     */
    getSelectedRows() {
        let rows = {};
        this.getSelected().forEach(key => {
            rows[key.split('::')[1]] = 1;
        });
        return Object.keys(rows);
    }

    /**
     * Get index of selected cols
     * @return {string[]}
     */
    getSelectedCols() {
        let cols = {};
        this.getSelected().forEach(key => {
            cols[key.split('::')[0]] = 1;
        });
        return Object.keys(cols);
    }

    /**
     * Create new index DOM
     * @return {Core}
     * @private
     */
    _reindex() {
        this.dataMap = {};
        this.instanceData = [];

        this.instanceHeader = [];

        if (this.dom.body && this.dom.body.children) {

            helper._likeArray(this.dom.body.children).forEach((tr, rowNum) => {
                this.instanceData[rowNum] = [];

                helper._likeArray(tr.children).forEach((td, colNum) => {
                    let val = td.innerHTML;
                    this.dataMap[`${colNum}::${rowNum}`] = td;
                    this.instanceData[rowNum].push(val);
                });
            });
        }

        if (this.dom.header && this.dom.header.firstElementChild) {

            helper._likeArray(this.dom.header.firstElementChild.children).forEach((th, colNum) => {
                this.instanceHeader.push(th.innerHTML);
                this.dataMap[`${colNum}::-1`] = th;
            });
        }
        return this;
    }

    /**
     * render table
     * @return {Core}
     * @private
     */
    _render() {
        let rowsClass = this.config.rowsClass,
            colsClass = this.config.colsClass;

        // create table
        this.dom.table = helper.createElement('table', 'bomtable');
        this.config.tableClass && this.dom.table.classList.add(this.config.tableClass);

        this._prepareData(this.config.data);
        this._prepareHeader(this.config.header);

        if (!this.dom.header && this.instanceHeader.length) {
            this.dom.header = d.createElement('thead');
            this.dom.header.appendChild(d.createElement('tr'));
        }

        this.instanceHeader.forEach((cell, colNum) => {
            let th = d.createElement('th');
            th.innerHTML = cell;
            this.dom.header.firstElementChild.appendChild(th);
            this.dataMap[`${colNum}::-1`] = th;
        });

        if (!this.dom.header) {
            this.removeHeader();
        }

        this.dom.header && this.dom.table.appendChild(this.dom.header);

        this.dom.body = helper.createElement('tbody', '', this.dom.table);

        this.instanceData.forEach((col, rowNum) => {
            let tr = d.createElement('tr');
            colsClass && tr.classList.add(colsClass);

            col.forEach((cell, colNum) => {
                let td = d.createElement('td');
                rowsClass && td.classList.add(rowsClass);
                td.innerHTML = cell;

                tr.appendChild(td);
                this.dataMap[`${colNum}::${rowNum}`] = td;
            });

            this.dom.body.appendChild(tr);
        });

        if (!this.dom.wrapper) {
            this.container =
                typeof this.config.container === 'string'
                    ? d.querySelector(this.config.container)
                    : this.config.container;

            this.dom.wrapper = helper.createElement('div', 'bomtable-wrapper', this.container);

            this.dom.wrapper.appendChild(this.dom.table);

            this.container.style.position = 'relative';
        }

        return this;
    }

    /**
     * Remove table header
     * @return {Core}
     */
    removeHeader() {
        this.dom.header && helper.removeElement(this.dom.header);
        this.dom.header = null;
        return this;
    }

    /**
     * create context menu
     * @param e
     * @return {Core}
     */
    createContextMenu(e) {
        let html = '',
            className;

        if (this.config.contextMain) {
            e.preventDefault();

            Object.keys(this.config.contextMain.items).forEach(key => {

                if (key === 'hr') {
                    html += `<li class="${key}"></li>`;
                } else {
                    className = key.replace(/[A-Z]/g, m => `-${m[0].toLowerCase()}`);
                    html += `<li data-action="${key}" class="${className}">${this.config.contextMain.items[key]}</li>`;
                }

            });

            if (!this.dom.menu) {
                this.dom.menu = helper.createElement('ul', 'bomtable-context-menu', this.dom.wrapper);
            }

            this.dom.menu.innerHTML = html;
            this.dom.menu.style.display = 'block';
            this.dom.menu.style.left = e.pageX + 'px';
            this.dom.menu.style.top = e.pageY + 'px';
        }

        return this;
    }

    /**
     * close menu
     * @param e
     * @return {Core}
     */
    closeMenu(e) {

        let el = e && e.target,
            action;

        if (el && !e.button && this.dom.menu && helper._likeArray(this.dom.menu.children).some(li => li === el)) {
            action = el.dataset.action;

            if (this.config.contextMain.callback) {
                this.config.contextMain.callback(action, this, e);
            } else if (this[action]) {
                this[action]();
            } else {
                throw new Error('Undefined action ' + action);
            }
        }

        this.dom.menu && helper.removeElement(this.dom.menu);
        this.dom.menu = null;

        return this;
    }

    /**
     * **** events ****
     */

    /**
     * mouse down listener
     * @param {event} e
     * @private
     */
    _onmousedown(e) {
        let el = e.target;

        if (this.input && el === this.input.el) return;

        this._removeInput(false);

        this.closeMenu(e);

        if (!helper.parents(el).some(p => p === this.dom.table)) {
            if (this.dom.square && this.dom.square === el) {
                this.squarePressed = 1;
                this.mouseBtnPressed = 1;
            } else {
                this.clearActiveArea();
                this._removeSquare();
            }
            return;
        }

        this.mouseBtnPressed = 1;

        this._removeSquare();

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        // left click on select area
        if (e.button && this.selected.some(key => this.dataMap[key] === el)) return;

        this._setActiveCell(e);

    }

    /**
     * mouse up listener
     * @private
     */
    _onmouseup() {
        this.mouseBtnPressed = 0;
        this.squarePressed = 0;
        this._removeCopyArea();
    }

    /**
     * Mouse over listener
     * @param {event} e
     * @private
     */
    _onmouseover(e) {
        let el = e.target;

        if (!this.mouseBtnPressed) return;

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        !this.squarePressed && this._setActiveCell(e);
    }

    /**
     * Mouse move listener
     * @param {event} e
     * @private
     */
    _onmousemove(e) {
        let el = e.target;
        if (!this.mouseBtnPressed || this.lastHover === el) return;

        this.lastHover = el;

        if (this.squarePressed && el.tagName === 'TD') {
            this._squareAreaListener(e);
        }
    }

    /**
     * On mouse double click listener
     * @param e
     * @private
     */
    _ondblclick(e) {
        let el = e.target;

        if (el.tagName !== 'TD') {
            return;
        }

        this._setActiveCell(e);

        this._createInput();
    }

    /**
     * Context menu listener
     * @param {event} e
     * @private
     */
    _oncontextmenu(e) {
        let el = e.target;

        if (!helper.parents(el).some(p => p === this.dom.table)) {
            return;
        }

        this.createContextMenu(e);
    }

    /**
     * On key down listener
     * @param {event} e
     * @private
     */
    _keyDownWatcher(e) {

        if (e.ctrlKey) {
            this._createBuffer();
        }

        let el = this.input && this.input.el,
            keyCode = e.keyCode,
            val = el && el.value,
            colNum = this.lastSelected && this.lastSelected.colNum,
            rowNum = this.lastSelected && this.lastSelected.rowNum,
            totalCols = this.instanceData[0].length - 1,
            totalRows = this.instanceData.length - 1,
            moveSelect = false, // признак движения выделения клавишами
            map = {start: {colNum, rowNum}, end: {colNum, rowNum}};

        el && e.stopPropagation();

        switch (keyCode) {
            case 37: // left
                // cursor move inside input
                if (el && el.selectionStart !== 0) {
                    return;
                }
                if (colNum > 0) {
                    moveSelect = true;
                    map.start.colNum = map.end.colNum = colNum - 1;
                }
                break;
            case 39: // right
                // cursor move inside input
                if (el && el.selectionEnd < val.length) {
                    return;
                }
                if (totalCols > colNum) {
                    moveSelect = true;
                    map.start.colNum = map.end.colNum = colNum + 1;
                }
                break;
            case 38: // up
                if (rowNum > 0) {
                    moveSelect = true;
                    map.start.rowNum = map.end.rowNum = rowNum - 1;
                }
                break;
            case 40: // down
                if (totalRows > rowNum) {
                    moveSelect = true;
                    map.start.rowNum = map.end.rowNum = rowNum + 1;
                }
                break;
            case 13: // enter
                el ? this._removeInput() : this._createInput();
                e.preventDefault();
                break;
            case 27: // esc
                this.mouseBtnPressed = 0;
                this.squarePressed = 0;
                this._removeInput(false);
                this._removeCopyArea(false);
                break;
        }

        // need move active area
        if (moveSelect) {
            e.preventDefault();
            this._removeInput();
            this._setActiveArea(map);
        } else if (!el && !e.ctrlKey && !e.shiftKey && !this._keysIgnore.includes(e.keyCode) && !this.mouseBtnPressed) {
            this._createInput(false)
        }

        this.closeMenu()
    }

    /**
     * On paste listener
     * @param {event} e
     * @private
     */
    _onPaste(e) {

        e.stopPropagation();
        e.preventDefault();

        let tableData = {},
            tmp = [],
            pasteData = (e.clipboardData || window.clipboardData).getData('Text');

        this.getSelected().forEach(key => {
            let rowNum = key.split('::')[1];
            if (!tableData[rowNum]) tableData[rowNum] = [];
            tableData[rowNum].push(key)
        });

        tableData = Object.values(tableData);

        pasteData = pasteData.split('\n');

        pasteData.forEach(row => {
            tmp.push(row.split('\t'));
        });
        pasteData = tmp;

        if (tableData.length > pasteData.length) {
            let index = 0,
                lengthPasteData = pasteData.length;
            while (tableData.length > pasteData.length) {
                pasteData.push(pasteData[index++]);
                if (index === lengthPasteData) index = 0;
            }
        }

        if (tableData[0].length > pasteData[0].length) {
            pasteData.forEach(row => {
                let index = 0,
                    lengthPasteData = pasteData[0].length;
                while (tableData[0].length > row.length) {
                    row.push(row[index++]);
                    if (index === lengthPasteData) index = 0;
                }
            });
        }

        tableData.forEach((row, rowIndex) => {
            row.forEach((key, colIndex) => {
                let val = pasteData[rowIndex][colIndex],
                    [colNum, rowNum] = key.split('::');

                if (val != 0) {
                    val = isNaN(+val) ? val : +val;
                }

                this.setDataCell(colNum, rowNum, val);
            });
        });
    }

    /**
     * Create copy/paste buffer and set focus
     * @private
     */
    _createBuffer() {
        let str = [];

        if (!this.dom._buffer) {
            this.dom._buffer = helper.createElement('textarea', 'bomtable-buffer', this.dom.wrapper);
            this.dom._buffer.addEventListener('paste', this._onPaste.bind(this));
        }

        this.getSelectedData().forEach(row => {
            str.push(row.join('\t'));
        });

        this.dom._buffer.value = str.join('\n');

        this.dom._buffer.select();
        this.dom._buffer.focus();
    }

    /**
     * Set active cell
     * @param {object} e - event
     * @return {{el: HTMLElement, colNum: number, rowNum: number}}
     */
    _setActiveCell(e) {

        let el = e.target,
            type = e.type,
            keyType = 'none',
            keyMap;

        if (e.shiftKey) {
            keyType = 'shiftKey'
        } else if (e.ctrlKey) {
            keyType = 'ctrlKey'
        }

        helper.clearSelected();

        Object.keys(this.dataMap).some(key => {
            if (this.dataMap[key] === el) {
                keyMap = key.split('::');
                return true;
            }
        });

        let [colNum, rowNum] = keyMap;

        colNum = +colNum;
        rowNum = +rowNum;

        if (type === 'mousedown') {
            this.mouseDownElement = {el, colNum, rowNum};
        }

        this._setActiveArea({
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
     * @return {{el: *, colNum: *, rowNum: *}}
     * @private
     */
    _setLastSelected(el, colNum, rowNum) {
        if (this.lastSelected && this.lastSelected.el === el) return;

        return this.lastSelected = {el, colNum, rowNum};
    }

    /**
     * Save and mark active area
     * @param {object} map
     * @param {string} keyType - 'shiftKey' | 'ctrlKey' | 'none'
     * @return {Core}
     * @private
     */
    _setActiveArea(map, keyType = 'none') {
        let
            startCol = map.start.colNum,
            endCol = map.end.colNum,
            startRow = map.start.rowNum,
            endRow = map.end.rowNum,

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
                let key = `${col}::${row}`;
                if (this.selected.includes(key)) {
                    this.selected = this.selected.filter(s => s !== key);
                } else {
                    this.selected.push(key);
                }
                this.dataMap[key].classList.toggle('area');
            })
        });

        if (this.selected.length === 1) {
            let chunks = this.selected[0].split('::');
            this._setLastSelected(this.dataMap[this.selected[0]], +chunks[0], +chunks[1]);
        }

        this.lastSelectArea = {start: {col: startCol, row: startRow}, end: {col: endCol, row: endRow}};
        this._createSquare(endCol, endRow);
        return this;
    }

    /**
     * Clear active area
     * @return {Core}
     */
    clearActiveArea() {
        this.instanceData.length && this.getSelected().forEach(key => {
            let el = this.dataMap[key];
            el && el.classList.remove('area');
        });

        this.lastSelectArea = {};
        this.selected = [];
        this.lastSelected = null;

        return this;
    }

    _getRectWrapper() {
        return this.container.getBoundingClientRect();
    }

    /**
     * Create square
     * @param {number} endCol - end col
     * @param {number} endRow - end row
     * @return {Core}
     * @private
     */
    _createSquare(endCol, endRow) {
        let downRightTd = this.dataMap[`${endCol}::${endRow}`],
            wrapRect = this._getRectWrapper(),
            rect = downRightTd.getBoundingClientRect();

        if (downRightTd.tagName !== 'TD') return this;

        if (!this.dom.square) {
            this.dom.square = helper.createElement('div', 'bomtable-square', this.dom.wrapper);
        }

        this.dom.square.style.top = rect.bottom - wrapRect.top + 'px';
        this.dom.square.style.left = rect.right - wrapRect.left + 'px';

        return this;
    }

    /**
     * Remove square
     * @return {Core}
     * @private
     */
    _removeSquare() {
        this.dom.square && helper.removeElement(this.dom.square);
        this.dom.square = null;
        return this;
    }

    /**
     * Listener move square
     * @param {event} e
     * @private
     */
    _squareAreaListener(e) {

        let bottomRightSelectTr = this.dataMap[`${this.lastSelectArea.end.col}::${this.lastSelectArea.end.row}`],
            rectBRSTr = bottomRightSelectTr.getBoundingClientRect(),
            elMap = {},
            firstTd, firstRect, lastTd, lastRect,
            startCol, endCol, startRow, endRow;

        this.direction = {};

        Object.keys(this.dataMap).some(key => {
            let td = this.dataMap[key],
                splitKey;

            if (td !== e.target) return false;

            splitKey = key.split('::');
            elMap.col = +splitKey[0];
            elMap.row = +splitKey[1];

            return true;
        });

        endCol = elMap.col;
        endRow = elMap.row;

        if (rectBRSTr.right > e.pageX + w.pageXOffset) { // left

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

        if (rectBRSTr.top > e.pageY + w.pageYOffset) { // up

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

        firstTd = this.dataMap[`${startCol}::${startRow}`];
        firstRect = firstTd.getBoundingClientRect();

        lastTd = this.dataMap[`${endCol}::${endRow}`];
        lastRect = lastTd.getBoundingClientRect();

        helper.clearSelected();

        this
            ._renderSquareDragArea({
                left: firstRect.left - 1,
                top: firstRect.top - 1,
                bottom: lastRect.bottom - 1,
                right: lastRect.right - 1
            })
            ._setSquareDragCell({startCol, endCol, startRow, endRow})
    }

    /**
     * Draw drag area
     * @param position
     * @return {Core}
     * @private
     */
    _renderSquareDragArea(position) {

        let wrapRect = this._getRectWrapper();
        if (!this.dom.copyAreaLeft) {
            this.dom.copyAreaLeft = helper.createElement('div', 'bomtable-copy-area-left', this.dom.wrapper);
            this.dom.copyAreaRight = helper.createElement('div', 'bomtable-copy-area-right', this.dom.wrapper);
            this.dom.copyAreaTop = helper.createElement('div', 'bomtable-copy-area-top', this.dom.wrapper);
            this.dom.copyAreaBottom = helper.createElement('div', 'bomtable-copy-area-bottom', this.dom.wrapper);
        }

        this.dom.copyAreaLeft.style.top = position.top - wrapRect.top + 'px';
        this.dom.copyAreaLeft.style.left = position.left - wrapRect.left + 'px';
        this.dom.copyAreaLeft.style.height = position.bottom - position.top + 'px';

        this.dom.copyAreaRight.style.top = position.top - wrapRect.top + 'px';
        this.dom.copyAreaRight.style.left = position.right - wrapRect.left + 'px';
        this.dom.copyAreaRight.style.height = position.bottom - position.top + 'px';

        this.dom.copyAreaTop.style.top = position.top - wrapRect.top + 'px';
        this.dom.copyAreaTop.style.left = position.left - wrapRect.left + 'px';
        this.dom.copyAreaTop.style.width = position.right - position.left + 'px';

        this.dom.copyAreaBottom.style.top = position.bottom - wrapRect.top + 'px';
        this.dom.copyAreaBottom.style.left = position.left - wrapRect.left + 'px';
        this.dom.copyAreaBottom.style.width = position.right - position.left + 'px';

        return this;
    }

    /**
     * Draw square
     * @param {Object} map coords {startCol, endCol, startRow, endRow}
     * @return {Core}
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
     * @return {Core}
     * @private
     */
    _removeCopyArea(saveValue = true) {

        this.dom.copyAreaLeft && helper.removeElement(this.dom.copyAreaLeft);
        this.dom.copyAreaRight && helper.removeElement(this.dom.copyAreaRight);
        this.dom.copyAreaTop && helper.removeElement(this.dom.copyAreaTop);
        this.dom.copyAreaBottom && helper.removeElement(this.dom.copyAreaBottom);

        this.dom.copyAreaLeft = this.dom.copyAreaRight = this.dom.copyAreaTop = this.dom.copyAreaBottom = null;

        if (saveValue && this.squareDragArea.length) {

            let tableData = {},
                squareAreaData = {},
                map = {start: {colNum: null, rowNum: null}, end: {colNum: null, rowNum: null}};

            this.getSelected().forEach(key => {
                let rowNum = key.split('::')[1];
                if (!tableData[rowNum]) tableData[rowNum] = [];
                tableData[rowNum].push(key)
            });
            tableData = Object.values(tableData);

            this.squareDragArea.forEach(key => {
                let rowNum = key.split('::')[1];
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
                            [colNum, rowNum] = key.split('::');

                        if (map.start.colNum === null || map.start.colNum > colNum) map.start.colNum = +colNum;
                        if (map.start.rowNum === null || map.start.rowNum > rowNum) map.start.rowNum = +rowNum;

                        if (map.end.colNum === null || colNum > map.end.colNum) map.end.colNum = +colNum;
                        if (map.end.rowNum === null || rowNum > map.end.rowNum) map.end.rowNum = +rowNum;

                        if (copyKey === key) return;

                        let [colCopyNum, rowCopyNum] = copyKey.split('::'),
                            val = this.getDataCell(+colCopyNum, +rowCopyNum);

                        this.setDataCell(+colNum, +rowNum, val);
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
            wrapRect = this._getRectWrapper(),
            textarea = helper.createElement('textarea', 'bomtable-input', this.dom.wrapper, {
                left: tdRect.left - wrapRect.left - 1 + 'px',
                top: tdRect.top - wrapRect.top - 1 + 'px',
                width: tdRect.width - 1 + 'px',
                height: tdRect.height - 1 + 'px',
            });

        if (setCellValue) {
            textarea.value = td.innerText;
        }

        textarea.focus();

        this.input = {el: textarea, colNum: this.lastSelected.colNum, rowNum: this.lastSelected.rowNum};

        return this._removeSquare();
    }

    /**
     * Remove table textarea
     * @param {boolean} saveValue - save value before remove textarea
     * @private
     */
    _removeInput(saveValue = true) {

        if (!this.input) return;

        let val = this.input.el.value,
            colNum = this.input.colNum,
            rowNum = this.input.rowNum;

        helper.removeElement(this.input.el);
        this.input = null;

        if (saveValue) {

            if (val != 0) {
                val = isNaN(+val) ? val : +val; // number or string
            }

            this.setDataCell(colNum, rowNum, val);
        }
    }

    /**
     * Clear data of instance
     * @return {Core}
     */
    clear() {

        this.dom = {};
        this._removeInput(false);
        this._removeCopyArea(false);

        this.instanceData = [];
        this.instanceHeader = [];
        this.dataMap = {};

        this.lastSelectArea = {};
        this.dom && Object.keys(this.dom).forEach(nodeName => {
            this.dom[nodeName] && helper.removeElement(this.dom[nodeName]);
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

        d.removeEventListener('mousedown', this._onmousedown.bind(this));
        d.removeEventListener('mouseup', this._onmouseup.bind(this));

        d.removeEventListener('mouseenter', this._onmousemove.bind(this));
        d.removeEventListener('mouseover', this._onmouseover.bind(this));

        d.removeEventListener('dblclick', this._ondblclick.bind(this));

        d.removeEventListener('keydown', this._keyDownWatcher.bind(this));

        this.dom._buffer && this.dom._buffer.removeEventListener('paste', this._onPaste.bind(this));

        this.destroyed = 1;
        this.clear();
    }

}