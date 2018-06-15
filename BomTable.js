'use strict';

const d = document,
    w = window;

class BomTable {
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
            // [{"name": "Наименование", "action": "name", "class": "name"}, {"name": "H1", "action": "h1", "class": "h"}]
            contextMain: '' // TODO
        }, opts);

        return this.ini();
    }

    /**
     * Initialization
     * @return {BomTable}
     */
    ini() {
        window.BomTable = this;

        this.clear()._render();

        return this.callListeners();
    }

    /**
     * add event listeners
     * @return {BomTable}
     */
    callListeners() {

        d.addEventListener('mousedown', this._onmousedown.bind(this));
        d.addEventListener('mouseup', this._onmouseup.bind(this));

        d.addEventListener('mouseover', this._onmouseover.bind(this));

        d.addEventListener('dblclick', this._ondblclick.bind(this));

        d.addEventListener('keyup', this._keyUpWatcher.bind(this));
        d.addEventListener('keydown', this._keyDownWatcher.bind(this));

        return this;
    }

    /**
     * Set new data
     * @param data
     */
    setData(data) {
        if (!Array.isArray(data)) throw new Error('Data must be array');
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
        if (!Array.isArray(header)) throw new Error('Header must be array');
        this.config.header = header;
        this.clear()._render();
    }

    /**
     * Get instance header
     * @return {Array}
     */
    getHeader() {
        return this.instanceHeader;
    }

    /**
     * get data from selected items
     * @return {Array}
     */
    getSelectedData() {
        let data = {};

        this.selected.forEach(key => {
            let [colNum, rowNum] = key.split('::');
            if (!data[rowNum]) data[rowNum] = [];
            data[rowNum].push(this.instanceData[rowNum][colNum])
        });

        return Object.values(data);
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
     * @param header
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
     * render table
     * @return {BomTable}
     * @private
     */
    _render() {
        let rowsClass = this.config.rowsClass,
            colsClass = this.config.colsClass;

        // create table
        this.dom.table = d.createElement('table');
        this.dom.table.classList.add('bomtable');
        this.config.tableClass && this.dom.table.classList.add(this.config.tableClass);

        this._prepareData(this.config.data);
        this._prepareHeader(this.config.header);

        if (!this.dom.header && this.instanceHeader.length) {
            this.dom.header = d.createElement('thead');
        }

        this.instanceHeader.forEach((cell, colNum) => {
            let th = d.createElement('th');
            th.innerHTML = cell;
            this.dom.header.appendChild(th);
            this.dataMap[`${colNum}::-1`] = th;
        });

        if (!this.dom.header) {
            this.removeHeader();
        }

        this.dom.header && this.dom.table.appendChild(this.dom.header);

        this.dom.body = d.createElement('tbody');
        this.dom.table.appendChild(this.dom.body);

        this.instanceData.forEach((col, rowNum) => {
            let tr = d.createElement('tr');
            colsClass && tr.classList.add(colsClass);

            col.forEach((cell, colNum) => {
                let td = d.createElement('td');
                rowsClass && tr.classList.add(rowsClass);
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

            this.dom.wrapper = d.createElement('div');
            this.dom.wrapper.classList.add('bomtable-wrapper');

            this.dom.wrapper.appendChild(this.dom.table);

            this.container.appendChild(this.dom.wrapper);
            this.container.style.position = 'relative';
        }

        return this;
    }

    /**
     * Remove
     * @return {BomTable}
     */
    removeHeader() {
        this.dom.header && this.dom.header.remove();
        this.dom.header = null;
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

        this._removeInput(false);

        if (!BomTable.parents(el).some(p => p === this.dom.table)) {
            this.clearActiveArea();
            return;
        }

        this.mouseBtnPressed = 1;

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        this.setActiveCell(e);

    }

    /**
     * mouse up listener
     * @private
     */
    _onmouseup() {
        this.mouseBtnPressed = 0;
    }

    /**
     * mouse over listener
     * @param {event} e
     * @private
     */
    _onmouseover(e) {
        let el = e.target;

        if (!this.mouseBtnPressed) return;

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        this.setActiveCell(e);

        BomTable.clearSelected();
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

        this.setActiveCell(e);

        this._createInput();
    }

    /**
     * On key down listener
     * @param e
     * @private
     */
    _keyDownWatcher(e) {

        if (e.ctrlKey) {
            this._createBuffer();
        }
    }

    /**
     * On paste listener
     * @param e
     * @private
     */
    _onPaste(e) {

        e.stopPropagation();
        e.preventDefault();

        let tableData = {},
            tmp = [],
            pasteData = (e.clipboardData || window.clipboardData).getData('Text');

        pasteData = pasteData.split('\n');

        pasteData.forEach(row => {
            tmp.push(row.split('\t'));
        });
        pasteData = tmp;

        this.selected.forEach(key => {
            let rowNum = key.split('::')[1];
            if (!tableData[rowNum]) tableData[rowNum] = [];
            tableData[rowNum].push(key)
        });

        tableData = Object.values(tableData);

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

                val = isNaN(+val) ? val : +val;
                if (!val) val = '';

                this.dataMap[`${colNum}::${rowNum}`].innerHTML = val;
                this.instanceData[rowNum][colNum] = val;
            });
        });
    }

    /**
     * Keys press watcher
     * @param e
     * @private
     */
    _keyUpWatcher(e) {

        if (!this.lastSelected) {
            return;
        }

        this._inputKeyUp(e);
    }

    /**
     * watcher keys when cursor set in a textarea
     * @param e
     * @private
     */
    _inputKeyUp(e) {

        let el = this.input && this.input.el,
            keyCode = e.keyCode,
            val = el && el.value,
            colNum = this.lastSelected.colNum,
            rowNum = this.lastSelected.rowNum,
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
                this._removeInput();
                !el && this._createInput();
                e.preventDefault();
                break;
            case 27: // esc
                this._removeInput(false);
                break;
        }

        // need move active area
        if (moveSelect) {
            e.preventDefault();
            this._removeInput();
            this._setActiveAria(map, 'none');
        }

    }

    /**
     * Create copy/paste buffer and set focus
     * @private
     */
    _createBuffer() {
        let str = [];

        if (!this.dom._buffer) {

            this.dom._buffer = d.createElement('textarea');
            this.dom.wrapper.appendChild(this.dom._buffer);

            this.dom._buffer.classList.add('tableBuffer');

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
     * @return {{el: *, colNum: *, rowNum: *}}
     */
    setActiveCell(e) {
        let el = e.target,
            type = e.type,
            keyType = 'none',
            keyMap;

        if (e.shiftKey) {
            keyType = 'shiftKey'
        } else if (e.ctrlKey) {
            keyType = 'ctrlKey'
        }

        BomTable.clearSelected();

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

        this._setActiveAria({
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
     * @param {Node} el
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
     * @return {BomTable}
     * @private
     */
    _setActiveAria(map, keyType = 'none') {
        let
            startCol = map.start.colNum,
            endCol = map.end.colNum,
            startRow = map.start.rowNum,
            endRow = map.end.rowNum,

            rows = [],
            cols = [];

        // clear selected
        keyType === 'none' && this.clearActiveArea();

        if (keyType === 'shiftKey') {

        }

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
            endRow = this.instanceData[0].length - 1;
            // select all rows
            for (let i = startRow; endRow > i; i++) {
                rows.push(i);
            }
        }

        // if headers selected
        if (startRow < 0) {
            // remove headers
            rows = rows.filter(r => r > -1);
        }

        // array cols
        for (let i = startCol; endCol >= i; i++) {
            cols.push(i);
        }

        cols.forEach(col => {
            rows.forEach(row => {
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

        return this;
    }

    /**
     * Clear active area
     * @return {BomTable}
     */
    clearActiveArea() {
        this.selected.forEach(key => {
            this.dataMap[key].classList.remove('area');
        });

        this.selected = [];

        return this;
    }

    /**
     * Create table textarea
     * @private
     */
    _createInput() {
        let td = this.lastSelected.el,
            tdRect = td.getBoundingClientRect(),
            textarea = d.createElement('textarea');

        textarea.classList.add('bomtableInput');
        textarea.style.left = tdRect.left - 1 + 'px';
        textarea.style.top = tdRect.top - 1 + 'px';
        textarea.style.width = tdRect.width - 1 + 'px';
        textarea.style.height = tdRect.height - 1 + 'px';

        textarea.value = td.innerText;

        this.dom.wrapper.appendChild(textarea);

        textarea.addEventListener('keyup', this._inputKeyUp.bind(this));
        textarea.focus();

        this.input = {el: textarea, colNum: this.lastSelected.colNum, rowNum: this.lastSelected.rowNum};
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

        this.input.el.remove();
        this.input = null;

        if (saveValue) {

            if (val != 0) {
                val = isNaN(+val) ? val : +val; // number or string
            }

            this.dataMap[`${colNum}::${rowNum}`].innerHTML = val;
            this.instanceData[rowNum][colNum] = val;
        }
    }

    /**
     * Clear data of instance
     * @return {BomTable}
     */
    clear() {
        this._removeInput(false);

        this.instanceData = [];
        this.instanceHeader = [];
        this.dataMap = {};

        this.dom && Object.keys(this.dom).forEach(nodeName => {
            this.dom[nodeName].remove();
            delete this.dom[nodeName];
        });

        this.dom = {};
        this.selected = [];

        return this;
    }

    /**
     * 'destroy' and clear instance
     */
    destroy() {

        d.removeEventListener('mousedown', this._onmousedown.bind(this));
        d.removeEventListener('mouseup', this._onmouseup.bind(this));

        d.removeEventListener('mouseover', this._onmouseover.bind(this));

        d.removeEventListener('dblclick', this._ondblclick.bind(this));

        d.removeEventListener('keyup', this._keyUpWatcher.bind(this));
        d.removeEventListener('keydown', this._keyDownWatcher.bind(this));

        this.input && this.input.el.removeEventListener('keyup', this._inputKeyUp.bind(this));

        this.dom._buffer && this.dom._buffer.removeEventListener('paste', this._onPaste.bind(this));

        this.destroyed = 1;
        this.clear();
    }

    /**
     * **** static methods ****
     */

    static parents(el) {
        const els = [];
        while (el && el.tagName !== 'BODY') {
            els.unshift(el);
            el = el.parentNode;
        }
        return els;
    };

    static clearSelected() {
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
}