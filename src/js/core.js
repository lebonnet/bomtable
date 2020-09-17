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
            stickyHeader: true, // sticky table header
            tableClass: '', // css class table
            touchSupport: true, // support touch in browsers
            container: null, // node or selector for mount table
            rowsClass: '', // css class for table rows
            colsClass: '', // css class for table cols

            colsResize: false, // resizable columns
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
                    unionRows: 'union rows',
                    unionCols: 'union cols'
                },
                callback: null // function can be call after click context menu item
            },

            hooks: {},
            // header menu, cooking like context menu
            headerMenu: null
        }, opts);

        this.minColWidth = 60;
        this.isTouch = this.config.touchSupport && 'ontouchstart' in window;
        this.version = v.version;

        return instance = this._ini();
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

        return this._renderHelpers();
    }

    /**
     * Set new data
     * @param {Array} data
     */
    set data(data) {
        if (!Array.isArray(data)) throw new Error('Data must be an array');
        this.config.header = this.header;
        this.config.data = data;
        this.clear()._render()._renderHelpers();
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
     * @param {Number} col - col number of cell
     * @param {Number} row - row number of cell
     * @param {*} val - new value
     */
    set dataCell({col, row, val}) {
        let td = this.dataMap[`${col}::${row}`];
        td.bomtableValType = typeof val;
        val = helper.prepareValue(val);
        td.innerHTML = val;
        this.instanceData[row][col] = val;
        this._rerenderActiveArea();
        return this;
    }

    /**
     * Get cell value
     * @param {Number} col - col number of cell
     * @param {Number} row - row number of cell
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
            key = el.bomtableKey;
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
            let key = el.bomtableKey;
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
            key = el.bomtableKey;
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
     * @param {Number} row - row index
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
            let [colNum, rowNum] = helper._splitKey(key);
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

        let tr = helper.createElement({tagName: 'tr', selector: rowsClass});

        for (let colNum = 0; colNum < length; colNum++) {
            let cell = rowData[colNum] != null ? helper.prepareValue(rowData[colNum]) : '',
                td = helper.createElement({tagName: 'td', selector: colsClass, parent: tr, html: cell});
            td.bomtableValType = typeof cell;
            td.bomtableKey = helper.randKey();
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
            colsClass = this.config.colsClass || '',
            col = helper.createElement({tagName: 'col'}),
            copyCol = col.cloneNode(false);
        if (num != null) {
            Object.keys(this.dataMap).forEach(key => {
                if (key.indexOf(`${num}::`) !== 0) return;

                let el = this.dataMap[key],
                    parent = el.parentElement,
                    rowNum = +key.split('::')[1],
                    isHeader = rowNum < 0,
                    isCopyHeader = rowNum === -2,
                    child = isHeader ? this._createHeaderCell('', isCopyHeader) : helper.createElement({tagName: 'td'});

                if (!isHeader) {
                    child.bomtableKey = helper.randKey();
                    child.bomtableValType = 'string';
                    colsClass && child.classList.add(colsClass);
                }
                parent.insertBefore(child, el.nextSibling);
            });
            if (this.dom.header) {
                this.dom.colgroup.insertBefore(col, this.dom.colgroup.children[num].nextSibling);
                this.dom.copyColgroup.insertBefore(copyCol, this.dom.copyColgroup.children[num].nextSibling);
            }
            this._manualColSize = {};
        } else {
            if (this.dom.header) {
                this.dom.colgroup.appendChild(col) && this.dom.copyColgroup.appendChild(copyCol);
                this._createHeaderCell() && this._createHeaderCell('', true);
            }
            lastColIndex = this.instanceData[0].length - 1;
            while (it !== this.instanceData.length) {
                let td = helper.createElement({
                    tagName: 'td',
                    selector: colsClass,
                    parent: this.dataMap[`${lastColIndex}::${it++}`].parentElement
                });
                td.bomtableKey = helper.randKey();
                td.bomtableValType = 'string';
            }
        }

        return this._reindex()._setContainerWidth()._calcColsWidth();
    }

    /**
     * Remove get or selected rows
     * @param {Array} [nums] - index removes rows, if array is empty - selected rows will be removed
     * @return {BomTable}
     */
    removeRows(nums = []) {
        let rows = nums.length ? nums : this.selectedRows;

        rows.forEach(rowNum => {
            let firstTd = this.dataMap[`0::${rowNum}`],
                parentTr = firstTd && firstTd.parentNode;
            if (!parentTr) return;
            helper._likeArray(parentTr.children).forEach(td => {
                delete this.cellMeta[td.bomtableKey]
            });
            helper.removeElement(parentTr);
        });

        return this._reindex();
    }


    /**
     * Remove get cols or selected cols
     * @param {Array} [nums] - index removes cols, if array is empty - selected cols will be removed
     * @return {BomTable}
     */
    removeCols(nums = []) {
        let cols = nums.length ? nums : this.selectedCols;

        cols.forEach(colNum => {
            Object.keys(this.dataMap).forEach(key => {
                if (!key.indexOf(`${colNum}::`)) {
                    let el = this.dataMap[key],
                        header = this.dataMap[`${colNum}::-1`],
                        copyHeader = this.dataMap[`${colNum}::-2`];

                    if (el) {
                        delete this.cellMeta[el.bomtableKey];
                        helper.removeElement(el);
                    }
                    header && helper.removeElement(header);
                    copyHeader && helper.removeElement(copyHeader);
                }
            });
            if (this.dom.header) {
                helper.removeElement(this.dom.colgroup.children[colNum]);
                helper.removeElement(this.dom.copyColgroup.children[colNum]);
            }
        });
        this._manualColSize = {};

        return this._reindex()._setContainerWidth()._calcColsWidth();
    }

    /**
     * Union rows
     * @param {Array} [nums] - index unions rows, if array is empty - selected rows will be unions
     * @return {BomTable}
     */
    unionRows(nums = []) {
        let rows = nums.length ? nums : this.selectedRows;

        if (rows.length === 1) return this;
        let firstRowIndex = rows.shift(),
            data = this.data,
            fistRow = data[firstRowIndex];

        rows.forEach(rowIndex => {
            data[rowIndex].forEach((cell, colIndex) => {
                let newValue = helper.mergeValues(fistRow[colIndex], cell);
                fistRow[colIndex] = newValue;
                this.dataMap[`${colIndex}::${firstRowIndex}`].innerHTML = newValue
            });
            helper.removeElement(this.dom.rows[rowIndex])
        });

        return this._reindex()
    }

    /**
     * Union cols
     * @param {Array} [nums] - index unions cols, if array is empty - selected cols will be unions
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
        this.clear()._render()._renderHelpers();
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
                    meta = this.cellMeta[td.bomtableKey] || {};
                if (td.innerHTML !== cell) {
                    td.innerHTML = cell
                }
                renders && renders(this, td, colNum, rowNum, row[colNum], meta);
            });
        });

        this.instanceHeader.forEach((cell, colNum) => {
            let th = this.dataMap[`${colNum}::-1`],
                thc = this.dataMap[`${colNum}::-2`],
                childWrap = helper._likeArray(th.children).find(c => c.classList.contains('bomtable-header-cell-wrap')),
                val = childWrap ? childWrap.innerHTML : th.innerHTML;
            if (cell !== val) {
                childWrap ? childWrap.innerHTML = val : th.innerHTML = val;
                thc.innerHTML = th.innerHTML;
                renders && renders(this, thc, colNum, -2, val, {});
            }
        });

        return this._setContainerWidth()._calcColsWidth()._rerenderActiveArea()
    }

    /**
     * Calculate columns width
     * @return {BomTable}
     * @private
     */
    _calcColsWidth() {
        if (!this.dom.colgroup) return this;
        let isHeader = this.dom.header,
            colGroupChildren = helper._likeArray(this.dom.colgroup.children),
            copyColGroupChildren = helper._likeArray(this.dom.copyColgroup.children);
        isHeader && this.dom.header.classList.remove('bomtable-hidden');
        this.instanceData[0].forEach((cell, colNum) => {
            let width = this._getColWidth(colNum);
            copyColGroupChildren[colNum].style.width = colGroupChildren[colNum].style.width = `${width}px`;
        });
        isHeader && this.dom.header.classList.add('bomtable-hidden');

        return this
    }

    /**
     * Create new index DOM
     * @return {BomTable}
     * @private
     */
    _reindex() {
        let renders = this.config.renders;

        this.dom.rows = {};
        this.dataMap = {};
        this.instanceData = [];

        this.instanceHeader = [];

        if (this.dom.header && this.dom.header.firstElementChild) {
            ['header', 'copyHeader'].forEach(h => {
                helper._likeArray(this.dom[h].firstElementChild.children).forEach((th, colNum) => {
                    let childWrap = helper._likeArray(th.children).find(c => c.classList.contains('bomtable-header-cell-wrap')),
                        val = childWrap ? childWrap.innerHTML : th.innerHTML,
                        rowIndex = h === 'copyHeader' ? -2 : -1;
                    this.dataMap[`${colNum}::${rowIndex}`] = th;
                    if (rowIndex === -1) {
                        this.instanceHeader.push(val);
                    } else if (renders) {
                        renders(this, th, colNum, rowIndex, val, {});
                    }
                });
            })
        }

        if (this.dom.body && this.dom.body.children) {
            helper._likeArray(this.dom.body.children).forEach((tr, rowNum) => {
                this.dom.rows[rowNum] = tr;
                this.instanceData[rowNum] = [];
                helper._likeArray(tr.children).forEach((td, colNum) => {
                    let val = td.innerHTML,
                        meta = this.cellMeta[td.bomtableKey] || {};
                    if (td.bomtableValType === 'number') {
                        val = +val
                    }
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
        this.dom.copyTable = helper.createElement({tagName: 'table', selector: 'bomtable'});

        this.dom.copyTable.classList.add('bomtable-copy-table');
        this.config.stickyHeader && this.dom.copyTable.classList.add('sticky');

        if (this.config.tableClass) {
            this.dom.table.classList.add(this.config.tableClass);
            this.dom.copyTable.classList.add(this.config.tableClass);
        }

        this._prepareData(this.config.data);

        if (!this.instanceData[0]) return this;

        if (!this.dom.wrapper) {
            this.dom.colgroup = helper.createElement({tagName: 'colgroup', parent: this.dom.table});
            this.dom.copyColgroup = helper.createElement({tagName: 'colgroup', parent: this.dom.copyTable});

            this.instanceData[0].forEach(() => {
                helper.createElement({tagName: 'col', parent: this.dom.colgroup});
                helper.createElement({tagName: 'col', parent: this.dom.copyColgroup});
            });
        }

        this._renderHeader();
        this.dom.body = helper.createElement({tagName: 'tbody', parent: this.dom.table, selector: 'building'});

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

            this.dom.wrapper.appendChild(this.dom.copyTable);
            this.dom.wrapper.appendChild(this.dom.table);

            this._container.style.position = 'relative';
            this._container.style.overflow = 'auto';

            this._container.addEventListener('scroll', this._onContainerScroll);
        }

        this._container.style.opacity = '0';
        setTimeout(() => {
            this._setContainerWidth()._calcColsWidth();
            this.dom.body.classList.remove('building');
            this._container.style.opacity = ''
        }, 5);

        return this;
    }

    /**
     * Render table header
     * @return {BomTable}
     * @private
     */
    _renderHeader() {
        if (!this.instanceData[0]) return this;

        let renders = this.config.renders;

        this._prepareHeader(this.config.header);

        if (!this.dom.header && this.instanceHeader.length) {
            this.dom.header = helper.createElement({tagName: 'thead', selector: 'bomtable-hidden'});
            helper.createElement({tagName: 'tr', parent: this.dom.header});

            this.dom.copyHeader = helper.createElement({tagName: 'thead'});
            helper.createElement({tagName: 'tr', parent: this.dom.copyHeader});
        }

        this.instanceHeader.forEach((value, colNum) => {
            this.dataMap[`${colNum}::-1`] = this._createHeaderCell(value);
            this.dataMap[`${colNum}::-2`] = this._createHeaderCell(value, true);
            renders && renders(this, this.dataMap[`${colNum}::-2`], colNum, -2, value, {});
        });

        if (this.dom.header) {
            this.dom.table.appendChild(this.dom.header);
            this.dom.copyTable.appendChild(this.dom.copyHeader);
            this.dom.table.classList.remove('bomtable-no-header');
        } else {
            this.removeHeader();
            this.dom.table.classList.add('bomtable-no-header');
        }

        return this
    }

    /**
     * Render helpers html elements
     * @return {BomTable}
     * @private
     */
    _renderHelpers() {
        if (!this.dom._buffer) {
            this.dom._buffer = helper.createElement({
                tagName: 'textarea',
                selector: 'bomtable-buffer',
                parent: this.dom.wrapper
            });
            this.dom._buffer.addEventListener('paste', this._onPaste);
        }
        if (this.config.colsResize) {
            this.dom._colResizer = helper.createElement({
                tagName: 'span',
                selector: 'bomtable-col-resizer',
                parent: this.dom.wrapper
            });
            this.dom._colResizerLine = helper.createElement({
                tagName: 'span',
                selector: 'bomtable-col-resizer-line',
                parent: this.dom.wrapper
            });
        }
        return this
    }

    /**
     * Create header cell
     * @param value
     * @param {Boolean} copy
     * @param {Boolean} onlyCreate
     * @returns {HTMLElement}
     * @private
     */
    _createHeaderCell(value = '', copy = false, onlyCreate = false) {
        let parent = !copy ? this.dom.header.firstElementChild : this.dom.copyHeader.firstElementChild,
            hasHeader = this.config.headerMenu,
            thClass = hasHeader ? 'bomtable-nw' : '',
            th = helper.createElement({tagName: 'th', selector: thClass, parent: onlyCreate ? null : parent});

        if (hasHeader) {
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
        ['header', 'copyHeader'].forEach(key => {
            let el = this.dom[key];
            if (!el) return;
            helper.removeElement(el);
            this.dom[key] = null
        });
        this.instanceData[0].forEach((c, colNum) => {
            delete this.dataMap[`${colNum}::-1`];
            delete this.dataMap[`${colNum}::-2`]
        });
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
            let left = e.pageX - wrapPos.left - w.pageXOffset,
                top = e.pageY - wrapPos.top - w.pageYOffset,
                menuWidth = instance.dom.contextMenu.offsetWidth,
                menuHeight = instance.dom.contextMenu.offsetHeight;
            if (menuWidth > instance._container.offsetWidth - left && left > menuWidth) {
                left = left - menuWidth
            }
            if (menuHeight > instance._container.offsetHeight - top && top > menuHeight) {
                top = top - menuHeight
            }
            instance.dom.contextMenu.style.display = 'block';
            instance.dom.contextMenu.style.left = left + 'px';
            instance.dom.contextMenu.style.top = top + 'px';
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
            let left = btnRect.left - wrapPos.left,
                menuWidth = instance.dom.headerMenu.offsetWidth;
            if (menuWidth > instance._container.offsetWidth - left && left > menuWidth) {
                left = left - menuWidth + el.offsetWidth
            }
            instance.dom.headerMenu.style.left = left + 'px';
            instance.dom.headerMenu.style.top = btnRect.bottom - wrapPos.top + 'px';
        }

        return instance;
    }

    /**
     * Close header menu
     * @param {MouseEvent} e
     * @return {BomTable}
     */
    closeHeaderMenu(e) {

        let lastSelected;
        Object.keys(instance.dataMap)
            .forEach(key => {
                let el = this.dataMap[key],
                    [colNum, rowNum] = helper._splitKey(key);
                if (rowNum >= 0 || !el.classList.contains('active')) return;
                el.classList.remove('active');
                lastSelected = {colNum, rowNum};
            });

        return instance._closeMenu(e, 'headerMenu', lastSelected);
    }

    /**
     * Create context or header menu
     * @param {MouseEvent} e
     * @param {String} menuName
     * @return {BomTable}
     * @private
     */
    _createMenu(e, menuName) {
        let html = '',
            isContext = menuName === 'contextMenu',
            className;

        if (instance.config[menuName]) {
            e.preventDefault();

            let data = {list: Object.assign({}, instance.config[menuName].items)},
                selectedColsCount = instance.selectedCols.length,
                selectedRowsCount = instance.selectedRows.length,
                hookName = `before${helper.firstCharToUp(menuName)}Render`;

            if (instance.config.hooks[hookName]) {
                instance.config.hooks[hookName](instance, data.list)
            }
            Object.keys(data.list).forEach(key => {
                if (/^hr+[0-9]*$/.test(key)) {
                    html += `<li class="bomtable-hr"></li>`;
                } else {
                    className = helper.camelCaseToKebabCase(key);
                    if (isContext && (key === 'unionCols' && selectedColsCount < 2 || key === 'unionRows' && selectedRowsCount < 2)) {
                        className += ' disabled'
                    }
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
     * @param {MouseEvent} e
     * @param {String} menuName
     * @param {Object} lastSelected
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
     * @param {MouseEvent} e
     * @private
     */
    _onmousedown(e) {
        if (!instance || instance.destroyed) return;

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

        if (!helper.parents(el).some(p => p === instance.dom.table || p === instance.dom.copyTable)) {
            if (instance.dom.square && instance.dom.square === el) {
                instance.squarePressed = 1;
                instance.mouseBtnPressed = 1;
                return;
            }

            if (instance.dom._colResizer === el) {
                instance.colResizerPressedIndex = +el.dataset.colNum;
            }

            instance.clearActiveArea();
            instance._removeSquare();
            instance._removePressed();

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
     * @param {MouseEvent} e
     * @private
     */
    _onmouseup(e) {
        if (!instance || instance.destroyed) return;

        let el = e.target;
        if (instance.isTouch) {
            instance.countTouch--;
        }
        instance.mouseBtnPressed = 0;
        instance.squarePressed = 0;

        if (instance.colResizerPressedIndex == null &&
            e.which === 1 &&
            el.classList.contains('bomtable-header-cell-btn') &&
            !el.parentNode.classList.contains('active')) {
            instance.closeHeaderMenu(e);
            instance.createHeaderMenu(e);
        } else {
            instance.closeHeaderMenu(e);
        }

        instance._setColSize(e)._removeCopyArea();
    }

    /**
     * Touch move listener
     * @param {MouseEvent} e
     * @private
     */
    _ontouchmove(e) {
        if (!instance || instance.destroyed) return;

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
        if (!instance || instance.destroyed) return;

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
        if (!instance || instance.destroyed) return;

        let el = e.target;

        if (instance.colResizerPressedIndex != null) {
            instance._setColResizerPosition(instance.colResizerPressedIndex, e.clientX + 2.5);
            helper.clearSelected();
        }

        if (instance.lastHover === el) return;

        if (instance.colResizerPressedIndex == null && instance.config.colsResize && el.tagName === 'TH') {
            instance._setColResizerPosition(el.cellIndex)
        }

        instance.lastHover = el;

        if (!instance.mouseBtnPressed) return;

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
        if (!instance || instance.destroyed) return;

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
        if (!instance || instance.destroyed) return;

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
        if (!instance || instance.destroyed) return;

        if (e.key === 'Escape') {
            if (instance.mouseBtnPressed && instance.dom.copyAreaLeft) {
                instance._removeCopyArea(false);
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            if (instance.colResizerPressedIndex != null) {
                instance._setColResizerPosition(0, -1);
                instance.colResizerPressedIndex = null;
                e.stopPropagation();
                e.preventDefault();
                return;
            }
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
            keyMustIgnore = helper._keysIgnore(key);

        if (e.ctrlKey && !el && key.toLowerCase() !== 'a') {
            instance._focusBuffer();
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
                        let [col, row] = helper._splitKey(key);
                        instance.dataMap[`${col}::${row}`] && (instance.dataCell = {col, row, val: ''});
                    });
                    keyMustIgnore = true;
                    instance._rerenderActiveArea();
                }
                break;
        }

        // ctrl + a
        if (!el && e.ctrlKey && key.toLowerCase() === 'a') {
            moveSelect = false;
            data = instance.data;
            map.start.rowNum = 0;
            map.start.colNum = 0;

            map.end.rowNum = data.length - 1;
            map.end.colNum = data[0].length - 1;
            instance._setActiveArea(map);
        }

        if (!el && e.ctrlKey && key.toLowerCase() === 'x') {
            instance.selected.forEach(key => {
                let [col, row] = helper._splitKey(key);
                instance.dataCell = {col, row, val: ''};
            });
        }

        // need move active area
        if (moveSelect) {
            e.preventDefault();
            instance._removeInput();
            if (map.start.rowNum < 1) map.start.rowNum = 0;
            if (map.end.rowNum < 1) map.end.rowNum = 0;
            instance._removePressed();
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
        if (!instance || instance.destroyed) return;

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
                let [colNum, rowNum] = helper._splitKey(key);

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

        instance._calcColsWidth()._setActiveArea(map);
    }

    /**
     * On container scroll listener
     * @param {KeyboardEvent|MouseEvent} e
     * @private
     */
    _onContainerScroll(e) {
        clearTimeout(instance.containerScrollTimeout);
        instance.containerScrollTimeout = setTimeout(() => {
            let elHelper = instance.dom.elHelper;
            if (!elHelper || !instance.lastSelected) return;
            let td = instance.lastSelected.el,
                tdRect = td.getBoundingClientRect(),
                wrapPos = instance._getWrapTopLeftPosition(),
                left = tdRect.left - wrapPos.left - 1;

            elHelper.left = `${left}px`;
            elHelper.maxWidth = `${instance._container.offsetWidth - left - 25 + instance._container.scrollLeft}px`;
            elHelper.minHeight = `${td.offsetHeight}px`;
        }, 50)
    }

    /**
     * Create copy/paste buffer and set focus
     * @private
     */
    _focusBuffer() {
        let str = [];

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

        this._removePressed();
        helper.clearSelected();

        let [colNum, rowNum] = this._colNumRowNumByEl(el);

        if (['mousedown', 'touchstart'].includes(type)) {
            this.mouseDownElement = {el, colNum, rowNum};
        }
        this.mouseDownElement.el.classList.add('pressed');

        this.mouseDownElement && this._setActiveArea({
            start: {
                colNum: this.mouseDownElement.colNum,
                rowNum: this.mouseDownElement.rowNum > -1 ? this.mouseDownElement.rowNum : 0,
            },
            end: {
                colNum,
                rowNum: this.mouseDownElement.rowNum > -1 ? rowNum : this.instanceData.length - 1,
            }
        }, keyType);

        return this._setLastSelected(el, colNum, rowNum);
    }

    /**
     * Save last selected cell
     * @param {HTMLElement} el
     * @param {Number} colNum
     * @param {Number} rowNum
     * @return {undefined|{el: *, colNum: *, rowNum: *}}
     * @private
     */
    _setLastSelected(el, colNum, rowNum) {
        if (this.lastSelected && this.lastSelected.el === el) return;

        return this.lastSelected = {el, colNum, rowNum};
    }

    /**
     * Save and mark active area
     * @param {Object} map {start: {colNum, rowNum}, end: {colNum, rowNum}}
     * @param {String} keyType - 'shiftKey' | 'ctrlKey' | 'none'
     * @return {BomTable}
     * @private
     */
    _setActiveArea(map, keyType = 'none') {

        if (this.destroyed) return this;

        let startCol = map.start.colNum,
            endCol = map.end.colNum,
            startRow = map.start.rowNum,
            endRow = map.end.rowNum,
            header = this.header || [],
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
                el.classList.toggle('area');
            })
        });

        if (this.selected.length === 1) {
            let chunks = helper._splitKey(this.selected[0]);
            this._setLastSelected(this.dataMap[this.selected[0]], chunks[0], chunks[1]);
        }

        this.lastSelectArea = {start: {col: startCol, row: startRow}, end: {col: endCol, row: endRow}};

        this._createSquare(endCol, endRow);

        this._addSquareArea(this._ariaPosition({startCol, startRow, endCol, endRow}), 'activeArea');

        header.length && this.selectedCols.forEach(colIndex => {
            let th = this.dataMap[`${colIndex}::-2`];
            th && th.classList.add('highlight');
        });

        this._scrollToActive();
        return this;
    }

    /**
     * Position of area
     * @param {Number} startCol
     * @param {Number} startRow
     * @param {Number} endCol
     * @param {Number} endRow
     * @param {Number} borderWidth - border width
     * @returns {{top: {Number}, left: {Number}, bottom: {Number}, right: {Number}}}
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
            top: firstRect.top - (!startRow ? 0 : borderHalf),
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
     * scroll to active area
     * @return {BomTable}
     * @private
     */
    _scrollToActive() {
        let selected = this.selected;
        if (selected.length > 1) return this;
        let container = this._container,
            elRect = this.dataMap[selected[0]].getBoundingClientRect(),
            wrapPos = this._getWrapTopLeftPosition(),
            top = elRect.top - wrapPos.top - 1,
            left = elRect.left - wrapPos.left,
            right = left + elRect.width,
            bottom = top + elRect.height + 1,

            headerHeight = this.dom.copyHeader ? this.dom.copyHeader.clientHeight : 0,

            topPoint = container.scrollTop,
            bottomPoint = topPoint + container.clientHeight,
            leftPoint = container.scrollLeft,
            rightPoint = leftPoint + container.clientWidth,
            scrollX = leftPoint,
            scrollY = topPoint;

        if (topPoint > top - headerHeight) {
            scrollY = top - headerHeight
        } else if (bottom > bottomPoint) {
            scrollY = topPoint + bottom - bottomPoint
        }

        if (leftPoint > left) {
            scrollX = left
        } else if (right > rightPoint) {
            scrollX = leftPoint + right - rightPoint
        }

        if (scrollX < 1 && scrollY < 1) return this;
        container.scrollTo(scrollX, scrollY)

        return this
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

        (this.header || []).forEach((v, index) => {
            let th = this.dataMap[`${index}::-2`];
            th && th.classList.remove('highlight');
        });

        return this;
    }

    /**
     * Get container top and lEft position
     * @return {Object}
     * @private
     */
    _getWrapTopLeftPosition() {
        let cont = this._container,
            rect = cont.getBoundingClientRect(),
            css = w.getComputedStyle(cont),
            getNumber = helper.getNumberFromString;

        return {
            top: rect.top - cont.scrollTop + getNumber(css.paddingTop) + getNumber(css.borderTopWidth),
            left: rect.left - cont.scrollLeft + getNumber(css.paddingLeft) + getNumber(css.borderLeftWidth)
        };
    }

    /**
     * Create draggable square
     * @param {Number} endCol - end col
     * @param {Number} endRow - end row
     * @return {BomTable}
     * @private
     */
    _createSquare(endCol, endRow) {
        let downRightTd = this.dataMap[`${endCol}::${endRow}`],
            topCorrector = this.instanceData.length === endRow + 1 ? 3 : 0,
            rightCorrector = this.instanceData[0].length === endCol + 1 ? 3 : 0,
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

        this.dom.square.style.top = rect.bottom - topCorrector - wrapPos.top + 'px';
        this.dom.square.style.left = rect.right - rightCorrector - wrapPos.left + 'px';

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
     * Remove pressed class from last active element
     * @private
     */
    _removePressed() {
        this.mouseDownElement && this.mouseDownElement.el.classList.remove('pressed');
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

            splitKey = helper._splitKey(key);
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
     * Max col width
     * @param colNum
     * @return {Number}
     * @private
     */
    _getColWidth(colNum) {
        this.dom.tmpTable = helper.createElement({tagName: 'table', selector: 'bomtable bomtable-copy-table'});
        this.dom.tmpTable.style.width = 'auto'
        let renders = this.config.renders;

        if (this.config.tableClass) {
            this.dom.tmpTable.classList.add(this.config.tableClass);
        }

        if (this.instanceHeader.length) {
            let header = helper.createElement({tagName: 'thead'});
            let tr = helper.createElement({tagName: 'tr', parent: header}),
                value = this.instanceHeader[colNum],
                th = this._createHeaderCell(value, false, true);
            renders && renders(this, th, colNum, -2, value, {});
            tr.appendChild(th)
            this.dom.tmpTable.appendChild(header)
        }

        this.dataCol(colNum).forEach((cell, rowNum) => {
            let tr = helper.createElement({tagName: 'tr', parent: this.dom.tmpTable}),
                td = helper.createElement({tagName: 'td', html: cell, parent: tr});
            renders && renders(this, td, colNum, rowNum, cell, {});
            tr.appendChild(td)
        });

        this.dom.wrapper.appendChild(this.dom.tmpTable);

        let width = this.dom.tmpTable.lastElementChild.lastElementChild.offsetWidth

        helper.removeElement(this.dom.tmpTable)
        this.dom.tmpTable = null
        return width
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
     * Set width for bomtabie container
     * @return {BomTable}
     * @private
     */
    _setContainerWidth() {
        this.dom.wrapper.style.width = '10000000px';
        let width = 0,
            isHeader = this.dom.header;
        isHeader && this.dom.header.classList.remove('bomtable-hidden');
        this.instanceData[0].forEach((c, colNum) => width += this._getColWidth(colNum));
        this.dom.wrapper.style.width = `${width}px`;
        isHeader && this.dom.header.classList.add('bomtable-hidden');
        return this
    }

    /**
     * @param {MouseEvent} event
     * @return {BomTable}
     * @private
     */
    _setColSize(event) {
        if (this.colResizerPressedIndex == null) return this;

        let isHeader = this.dom.header;

        if (isHeader) {
            this.dom.header.classList.remove('bomtable-hidden')
        }

        let colNum = this.colResizerPressedIndex,
            thLeft = this.dataMap[`${colNum}::-2`].getBoundingClientRect().left,
            wrapPosLeft = this._getWrapTopLeftPosition().left,
            width = (event.clientX - wrapPosLeft) - (thLeft - wrapPosLeft),
            colEl = helper._likeArray(this.dom.colgroup.children)[colNum];
        if (width < this.minColWidth) width = this.minColWidth;
        colEl.style.width = `${width}px`;

        width = Math.max.apply(Math, [width, this.dataMap[`${colNum}::0`].offsetWidth]);
        this._manualColSize[colNum] = width;
        this.colResizerPressedIndex = null;

        if (isHeader) {
            this.dom.header.classList.add('bomtable-hidden')
        }

        return this._setColResizerPosition(0, -1)._setContainerWidth()._calcColsWidth();
    }

    /**
     * Move ColResizer
     * @private
     * @param colNum
     * @param position
     * @return {BomTable}
     * @private
     */
    _setColResizerPosition(colNum, position) {
        let th = this.dataMap[`${colNum}::-2`],
            wrapPos = this._getWrapTopLeftPosition(),
            thRect = th.getBoundingClientRect(),
            thRight = position || thRect.right,
            tableRightPosition = this.dom.table.getBoundingClientRect().right;

        if (thRight < wrapPos.left) thRight = wrapPos.left;
        if (thRight > tableRightPosition) thRight = tableRightPosition;
        let calcPosition = thRight - wrapPos.left;

        this.dom._colResizer.style.left = `${calcPosition - 5}px`;
        this.dom._colResizer.style.top = `${thRect.top - wrapPos.top}px`;
        this.dom._colResizer.style.height = `${th.offsetHeight}px`;
        this.dom._colResizerLine.style.left = `${calcPosition}px`;

        !position && (this.dom._colResizer.dataset.colNum = colNum);

        return this
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

            let squareAreaMap = {},
                copyDataKeys = [],
                lsas = this.lastSelectArea.start,
                lsae = this.lastSelectArea.end,
                map = {start: {}, end: {}};

            for (let rowNum = lsas.row; rowNum <= lsae.row; rowNum++) {
                let rowData = [];
                for (let colNum = lsas.col; colNum <= lsae.col; colNum++) {
                    rowData.push(`${colNum}::${rowNum}`)
                }
                copyDataKeys.push(rowData);
            }

            this.squareDragArea.forEach(key => {
                let rowNum = +key.split('::')[1];
                if (rowNum < 0) return;
                if (!squareAreaMap[rowNum]) squareAreaMap[rowNum] = [];
                squareAreaMap[rowNum].push(key)
            });

            squareAreaMap = Object.values(squareAreaMap);

            if (copyDataKeys.length !== squareAreaMap.length || squareAreaMap[0].length !== copyDataKeys[0].length) {

                if (squareAreaMap.length > copyDataKeys.length) {
                    let index = 0,
                        lengthData = copyDataKeys.length;
                    while (squareAreaMap.length > copyDataKeys.length) {
                        if (this.direction.y === 'down') {
                            copyDataKeys.push(copyDataKeys[index++]);
                            if (index === lengthData) index = 0;
                        } else {
                            copyDataKeys.unshift(copyDataKeys[copyDataKeys.length - (++index)]);
                        }
                    }
                }

                if (squareAreaMap[0].length > copyDataKeys[0].length) {
                    copyDataKeys.forEach(row => {
                        let index = 0,
                            lengthData = copyDataKeys[0].length;
                        while (squareAreaMap[0].length > row.length) {
                            if (this.direction.x === 'right') {
                                row.push(row[index++]);
                                if (index === lengthData) index = 0;
                            } else {
                                row.unshift(row[row.length - (++index)]);
                            }
                        }
                    });
                }

                squareAreaMap.forEach((row, rowIndex) => {
                    row.forEach((key, colIndex) => {
                        let copyKey = copyDataKeys[rowIndex][colIndex],
                            [colNum, rowNum] = helper._splitKey(key);

                        if (map.start.colNum == null || map.start.colNum > colNum) map.start.colNum = colNum;
                        if (map.start.rowNum == null || map.start.rowNum > rowNum) map.start.rowNum = rowNum;

                        if (map.end.colNum == null || colNum > map.end.colNum) map.end.colNum = colNum;
                        if (map.end.rowNum == null || rowNum > map.end.rowNum) map.end.rowNum = rowNum;

                        if (copyKey === key) return;

                        let [colCopyNum, rowCopyNum] = helper._splitKey(copyKey),
                            val = this.dataCell(colCopyNum, rowCopyNum);

                        instance.dataCell = {col: colNum, row: rowNum, val};
                    })
                });

                this._setActiveArea(map);
            }

        }

        this.squareDragArea = [];
        this.direction = {};

        return this._setContainerWidth()._calcColsWidth();
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
            left = tdRect.left - wrapPos.left,
            textarea = helper.createElement({
                tagName: 'textarea',
                selector: 'bomtable-input',
                parent: this.dom.wrapper,
                css: {
                    left: `${(left > 0 ? left - 1 : left)}px`,
                    top: `${tdRect.top - wrapPos.top - 1}px`,
                }
            });

        textarea.addEventListener('input', this._onInput);

        if (setCellValue) {
            textarea.value = td.innerHTML;
        }

        textarea.focus();

        this.input = {el: textarea, colNum: this.lastSelected.colNum, rowNum: this.lastSelected.rowNum};
        this._createElHelper({td, left});

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
            tdRect = instance.lastSelected.el.getBoundingClientRect(),
            alignment = instance.lastSelected.colNum ? 1 : 0;
        elHelper.innerText = `${textarea.value}.`;

        let elHelperStyles = w.getComputedStyle(elHelper),
            countLines = Math.ceil(elHelper.scrollWidth / elHelper.offsetWidth),
            height = Math.max(helper.getNumberFromString(elHelperStyles.lineHeight) * countLines, tdRect.height + 1),
            minHeight = `${height}px`,
            minWidth = `${tdRect.width + alignment}px`;

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
     * @return {BomTable}
     * @private
     */
    _removeInput(saveValue = true) {

        if (!this.input) return this;

        let val = this.input.el.value,
            col = this.input.colNum,
            row = this.input.rowNum;

        val && !isNaN(+val) && (val = +val);

        this.input.el.removeEventListener('input', this._onInput);

        helper.removeElement(this.input.el);
        helper.removeElement(this.dom.elHelper);

        this.input = null;

        if (!saveValue) return this;
        this.dataCell = {col, row, val};

        return this._setContainerWidth()._calcColsWidth()
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

                maxWidth: `${this._container.offsetWidth - left - 25 + this._container.scrollLeft}px`,
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
     * Get node colNum and rowNum
     * @param {HTMLElement} el
     * @return {[ colNum, rowNum ]}
     * @private
     */
    _colNumRowNumByEl(el) {
        return helper._splitKey(Object.keys(this.dataMap).find(key => this.dataMap[key] === el));
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

        this._manualColSize = {};
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

        instance._container.removeEventListener('scroll', this._onContainerScroll);
        instance.dom._buffer && instance.dom._buffer.removeEventListener('paste', instance._onPaste);

        clearTimeout(instance.containerScrollTimeout);
        clearTimeout(instance.tapTimeout);

        instance.destroyed = 1;
        instance.clear();

        instance.config = {};

        instance = null
    }
}
