/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// import "babel-polyfill";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var d = document,
    w = window;

var BomTable = function () {
    function BomTable() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, BomTable);

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

        this._keysIgnore = [0, 9, 10, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123];

        return this._ini();
    }

    /**
     * Initialization
     * @return {BomTable}
     */


    _createClass(BomTable, [{
        key: '_ini',
        value: function _ini() {

            w.BomTable = this;

            this.clear()._render();

            return this._callListeners();
        }

        /**
         * add event listeners
         * @return {BomTable}
         */

    }, {
        key: '_callListeners',
        value: function _callListeners() {

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

    }, {
        key: 'setData',
        value: function setData(data) {
            if (!Array.isArray(data)) throw new Error('Data must be an array');
            this.config.data = data;
            this.clear()._render();
        }

        /**
         * Get instance data
         * @return {Array}
         */

    }, {
        key: 'getData',
        value: function getData() {
            return this.instanceData;
        }

        /**
         * Set new header
         * @param header
         */

    }, {
        key: 'setHeader',
        value: function setHeader(header) {
            if (!Array.isArray(header)) throw new Error('Header must be an array');
            this.config.header = header;
            return this.clear()._render();
        }

        /**
         * Set new cell value
         * @param {number} col - col number of cell
         * @param {number} row - row number of cell
         * @param {*} val - new value
         * @return {BomTable}
         */

    }, {
        key: 'setDataCell',
        value: function setDataCell(col, row, val) {
            this.dataMap[col + '::' + row].innerHTML = val;
            this.instanceData[row][col] = val;
            return this;
        }

        /**
         * Get instance header
         * @return {Array}
         */

    }, {
        key: 'getHeader',
        value: function getHeader() {
            return this.instanceHeader;
        }
    }, {
        key: 'getSelected',
        value: function getSelected() {
            return this.selected.sort();
        }

        /**
         * get data from selected items
         * @return {Array}
         */

    }, {
        key: 'getSelectedData',
        value: function getSelectedData() {
            var _this = this;

            var data = {};

            this.getSelected().forEach(function (key) {
                var _key$split = key.split('::'),
                    _key$split2 = _slicedToArray(_key$split, 2),
                    colNum = _key$split2[0],
                    rowNum = _key$split2[1];

                if (!data[rowNum]) data[rowNum] = [];
                data[rowNum].push(_this.instanceData[rowNum][colNum]);
            });

            return Object.values(data);
        }

        /**
         * Get cell value
         * @param {number} col - col number of cell
         * @param {number} row - row number of cell
         * @return {*}
         */

    }, {
        key: 'getDataCell',
        value: function getDataCell(col, row) {
            return this.instanceData[row][col];
        }

        /**
         * Prepare data (add empty value in short columns) and set copy data in instance
         * @param data
         * @private
         */

    }, {
        key: '_prepareData',
        value: function _prepareData(data) {
            var _this2 = this;

            var countCols = data.reduce(function (max, arr) {
                return max > arr.length ? max : arr.length;
            }, 0);
            data.forEach(function (col) {
                col = col.slice(0); // copy array
                while (countCols > col.length) {
                    col.push('');
                }_this2.instanceData.push(col);
            });
            return this;
        }

        /**
         * Prepare header table
         * @param {Array} header
         * @private
         */

    }, {
        key: '_prepareHeader',
        value: function _prepareHeader(header) {
            if (!header || !header.length) {
                this.instanceHeader = [];
                return;
            }
            while (this.instanceData[0].length > header.length) {
                header.push('');
            }header.length = this.instanceData[0].length;
            this.instanceHeader = header;
        }

        /**
         * AddNew row in table
         * @return {BomTable}
         */

    }, {
        key: 'addRow',
        value: function addRow() {
            var nextTr = this.lastSelected.el.parentNode.nextSibling,
                tableBody = this.dom.body,
                length = this.instanceData.length ? this.instanceData[0].length : this.instanceHeader.length,
                rowsClass = this.config.rowsClass,
                colsClass = this.config.colsClass;

            var tr = d.createElement('tr');
            colsClass && tr.classList.add(colsClass);

            while (length--) {
                var td = d.createElement('td');
                rowsClass && td.classList.add(rowsClass);

                tr.appendChild(td);
            }

            if (nextTr) {
                tableBody.insertBefore(tr, nextTr);
            } else {
                this.dom.body.appendChild(tr);
            }

            return this._reindex();
        }

        /**
         * Add new col
         * @return {BomTable}
         */

    }, {
        key: 'addCol',
        value: function addCol() {
            var _this3 = this;

            var num = this.lastSelected.colNum,
                rowsClass = this.config.rowsClass;

            Object.keys(this.dataMap).forEach(function (key) {
                if (!key.indexOf(num + '::')) {
                    var el = _this3.dataMap[key],
                        parent = el.parentElement,
                        nodeType = key.indexOf('-1') > -1 ? 'th' : 'td',
                        child = d.createElement(nodeType);

                    rowsClass && nodeType !== 'th' && child.classList.add(rowsClass);
                    parent.insertBefore(child, el.nextSibling);
                }
            });

            return this._reindex();
        }

        /**
         * Remove get rows or selected rows
         * @param {Array} [nums] - index removes rows, if array is empty - selected rows be removed
         * @return {BomTable}
         */

    }, {
        key: 'removeRows',
        value: function removeRows() {
            var _this4 = this;

            var nums = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            var rows = nums.length ? nums : this.getSelectedRows();

            rows.forEach(function (rowNum) {
                var firstTd = _this4.dataMap['0::' + rowNum],
                    parentTr = firstTd && firstTd.parentNode;
                if (!parentTr) return;
                parentTr.remove();
            });

            return this._reindex();
        }

        /**
         * Remove get cols or selected cols
         * @param {Array} [nums] - index removes cols, if array is empty - selected cols be removed
         * @return {BomTable}
         */

    }, {
        key: 'removeCols',
        value: function removeCols() {
            var _this5 = this;

            var nums = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            var cols = nums.length ? nums : this.getSelectedCols();

            cols.forEach(function (colNum) {
                Object.keys(_this5.dataMap).forEach(function (key) {
                    if (!key.indexOf(colNum + '::')) {
                        var el = _this5.dataMap[key],
                            header = _this5.dataMap[colNum + '::-1'];
                        el && el.remove();
                        header && header.remove();
                    }
                });
            });

            return this._reindex();
        }

        /**
         * Get index of selected rows
         * @return {Array}
         */

    }, {
        key: 'getSelectedRows',
        value: function getSelectedRows() {
            var rows = {};
            this.getSelected().forEach(function (key) {
                rows[key.split('::')[1]] = 1;
            });
            return Object.keys(rows);
        }

        /**
         * Get index of selected cols
         * @return {string[]}
         */

    }, {
        key: 'getSelectedCols',
        value: function getSelectedCols() {
            var cols = {};
            this.getSelected().forEach(function (key) {
                cols[key.split('::')[0]] = 1;
            });
            return Object.keys(cols);
        }

        /**
         * Create new index DOM
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_reindex',
        value: function _reindex() {
            var _this6 = this;

            this.dataMap = {};
            this.instanceData = [];

            this.instanceHeader = [];

            if (this.dom.body && this.dom.body.children) {

                BomTable._likeArray(this.dom.body.children).forEach(function (tr, rowNum) {
                    _this6.instanceData[rowNum] = [];

                    BomTable._likeArray(tr.children).forEach(function (td, colNum) {
                        var val = td.innerHTML;
                        _this6.dataMap[colNum + '::' + rowNum] = td;
                        _this6.instanceData[rowNum].push(val);
                    });
                });
            }

            if (this.dom.header && this.dom.header.firstElementChild) {

                BomTable._likeArray(this.dom.header.firstElementChild.children).forEach(function (th, colNum) {
                    _this6.instanceHeader.push(th.innerHTML);
                    _this6.dataMap[colNum + '::-1'] = th;
                });
            }
            return this;
        }

        /**
         * render table
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_render',
        value: function _render() {
            var _this7 = this;

            var rowsClass = this.config.rowsClass,
                colsClass = this.config.colsClass;

            // create table
            this.dom.table = BomTable.createElement('table', 'bomtable');
            this.config.tableClass && this.dom.table.classList.add(this.config.tableClass);

            this._prepareData(this.config.data);
            this._prepareHeader(this.config.header);

            if (!this.dom.header && this.instanceHeader.length) {
                this.dom.header = d.createElement('thead');
                this.dom.header.appendChild(d.createElement('tr'));
            }

            this.instanceHeader.forEach(function (cell, colNum) {
                var th = d.createElement('th');
                th.innerHTML = cell;
                _this7.dom.header.firstElementChild.appendChild(th);
                _this7.dataMap[colNum + '::-1'] = th;
            });

            if (!this.dom.header) {
                this.removeHeader();
            }

            this.dom.header && this.dom.table.appendChild(this.dom.header);

            this.dom.body = BomTable.createElement('tbody', '', this.dom.table);

            this.instanceData.forEach(function (col, rowNum) {
                var tr = d.createElement('tr');
                colsClass && tr.classList.add(colsClass);

                col.forEach(function (cell, colNum) {
                    var td = d.createElement('td');
                    rowsClass && td.classList.add(rowsClass);
                    td.innerHTML = cell;

                    tr.appendChild(td);
                    _this7.dataMap[colNum + '::' + rowNum] = td;
                });

                _this7.dom.body.appendChild(tr);
            });

            if (!this.dom.wrapper) {
                this.container = typeof this.config.container === 'string' ? d.querySelector(this.config.container) : this.config.container;

                this.dom.wrapper = BomTable.createElement('div', 'bomtable-wrapper', this.container);

                this.dom.wrapper.appendChild(this.dom.table);

                this.container.style.position = 'relative';
            }

            return this;
        }

        /**
         * Remove table header
         * @return {BomTable}
         */

    }, {
        key: 'removeHeader',
        value: function removeHeader() {
            this.dom.header && this.dom.header.remove();
            this.dom.header = null;
            return this;
        }

        /**
         * create context menu
         * @param e
         * @return {BomTable}
         */

    }, {
        key: 'createContextMenu',
        value: function createContextMenu(e) {
            var _this8 = this;

            var html = '',
                className = void 0;

            if (this.config.contextMain) {
                e.preventDefault();

                Object.keys(this.config.contextMain.items).forEach(function (key) {

                    if (key === 'hr') {
                        html += '<li class="' + key + '"></li>';
                    } else {
                        className = key.replace(/[A-Z]/g, function (m) {
                            return '-' + m[0].toLowerCase();
                        });
                        html += '<li data-action="' + key + '" class="' + className + '">' + _this8.config.contextMain.items[key] + '</li>';
                    }
                });

                if (!this.dom.menu) {
                    this.dom.menu = BomTable.createElement('ul', 'bomtable-context-menu', this.dom.wrapper);
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
         * @return {BomTable}
         */

    }, {
        key: 'closeMenu',
        value: function closeMenu(e) {

            var el = e && e.target,
                action = void 0;

            if (el && !e.button && this.dom.menu && BomTable._likeArray(this.dom.menu.children).some(function (li) {
                return li === el;
            })) {
                action = el.dataset.action;

                if (this.config.contextMain.callback) {
                    this.config.contextMain.callback(action, this, e);
                } else if (this[action]) {
                    this[action]();
                } else {
                    throw new Error('Undefined action ' + action);
                }
            }

            this.dom.menu && this.dom.menu.remove();
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

    }, {
        key: '_onmousedown',
        value: function _onmousedown(e) {
            var _this9 = this;

            var el = e.target;

            if (this.input && el === this.input.el) return;

            this._removeInput(false);

            this.closeMenu(e);

            if (!BomTable.parents(el).some(function (p) {
                return p === _this9.dom.table;
            })) {
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
            if (e.button && this.selected.some(function (key) {
                return _this9.dataMap[key] === el;
            })) return;

            this._setActiveCell(e);
        }

        /**
         * mouse up listener
         * @private
         */

    }, {
        key: '_onmouseup',
        value: function _onmouseup() {
            this.mouseBtnPressed = 0;
            this.squarePressed = 0;
            this._removeCopyArea();
        }

        /**
         * Mouse over listener
         * @param {event} e
         * @private
         */

    }, {
        key: '_onmouseover',
        value: function _onmouseover(e) {
            var el = e.target;

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

    }, {
        key: '_onmousemove',
        value: function _onmousemove(e) {
            var el = e.target;
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

    }, {
        key: '_ondblclick',
        value: function _ondblclick(e) {
            var el = e.target;

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

    }, {
        key: '_oncontextmenu',
        value: function _oncontextmenu(e) {
            var _this10 = this;

            var el = e.target;

            if (!BomTable.parents(el).some(function (p) {
                return p === _this10.dom.table;
            })) {
                return;
            }

            this.createContextMenu(e);
        }

        /**
         * On key down listener
         * @param {event} e
         * @private
         */

    }, {
        key: '_keyDownWatcher',
        value: function _keyDownWatcher(e) {

            if (e.ctrlKey) {
                this._createBuffer();
            }

            var el = this.input && this.input.el,
                keyCode = e.keyCode,
                val = el && el.value,
                colNum = this.lastSelected && this.lastSelected.colNum,
                rowNum = this.lastSelected && this.lastSelected.rowNum,
                totalCols = this.instanceData[0].length - 1,
                totalRows = this.instanceData.length - 1,
                moveSelect = false,
                // признак движения выделения клавишами
            map = { start: { colNum: colNum, rowNum: rowNum }, end: { colNum: colNum, rowNum: rowNum } };

            el && e.stopPropagation();

            switch (keyCode) {
                case 37:
                    // left
                    // cursor move inside input
                    if (el && el.selectionStart !== 0) {
                        return;
                    }
                    if (colNum > 0) {
                        moveSelect = true;
                        map.start.colNum = map.end.colNum = colNum - 1;
                    }
                    break;
                case 39:
                    // right
                    // cursor move inside input
                    if (el && el.selectionEnd < val.length) {
                        return;
                    }
                    if (totalCols > colNum) {
                        moveSelect = true;
                        map.start.colNum = map.end.colNum = colNum + 1;
                    }
                    break;
                case 38:
                    // up
                    if (rowNum > 0) {
                        moveSelect = true;
                        map.start.rowNum = map.end.rowNum = rowNum - 1;
                    }
                    break;
                case 40:
                    // down
                    if (totalRows > rowNum) {
                        moveSelect = true;
                        map.start.rowNum = map.end.rowNum = rowNum + 1;
                    }
                    break;
                case 13:
                    // enter
                    el ? this._removeInput() : this._createInput();
                    e.preventDefault();
                    break;
                case 27:
                    // esc
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
            } else if (!el && !e.ctrlKey && !e.shiftKey && !this._keysIgnore.includes(e.keyCode)) {
                this._createInput(false);
            }

            this.closeMenu();
        }

        /**
         * On paste listener
         * @param {event} e
         * @private
         */

    }, {
        key: '_onPaste',
        value: function _onPaste(e) {
            var _this11 = this;

            e.stopPropagation();
            e.preventDefault();

            var tableData = {},
                tmp = [],
                pasteData = (e.clipboardData || window.clipboardData).getData('Text');

            this.getSelected().forEach(function (key) {
                var rowNum = key.split('::')[1];
                if (!tableData[rowNum]) tableData[rowNum] = [];
                tableData[rowNum].push(key);
            });

            tableData = Object.values(tableData);

            pasteData = pasteData.split('\n');

            pasteData.forEach(function (row) {
                tmp.push(row.split('\t'));
            });
            pasteData = tmp;

            if (tableData.length > pasteData.length) {
                var index = 0,
                    lengthPasteData = pasteData.length;
                while (tableData.length > pasteData.length) {
                    pasteData.push(pasteData[index++]);
                    if (index === lengthPasteData) index = 0;
                }
            }

            if (tableData[0].length > pasteData[0].length) {
                pasteData.forEach(function (row) {
                    var index = 0,
                        lengthPasteData = pasteData[0].length;
                    while (tableData[0].length > row.length) {
                        row.push(row[index++]);
                        if (index === lengthPasteData) index = 0;
                    }
                });
            }

            tableData.forEach(function (row, rowIndex) {
                row.forEach(function (key, colIndex) {
                    var val = pasteData[rowIndex][colIndex],
                        _key$split3 = key.split('::'),
                        _key$split4 = _slicedToArray(_key$split3, 2),
                        colNum = _key$split4[0],
                        rowNum = _key$split4[1];


                    if (val != 0) {
                        val = isNaN(+val) ? val : +val;
                    }

                    _this11.setDataCell(colNum, rowNum, val);
                });
            });
        }

        /**
         * Create copy/paste buffer and set focus
         * @private
         */

    }, {
        key: '_createBuffer',
        value: function _createBuffer() {
            var str = [];

            if (!this.dom._buffer) {
                this.dom._buffer = BomTable.createElement('textarea', 'bomtable-buffer', this.dom.wrapper);
                this.dom._buffer.addEventListener('paste', this._onPaste.bind(this));
            }

            this.getSelectedData().forEach(function (row) {
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

    }, {
        key: '_setActiveCell',
        value: function _setActiveCell(e) {
            var _this12 = this;

            var el = e.target,
                type = e.type,
                keyType = 'none',
                keyMap = void 0;

            if (e.shiftKey) {
                keyType = 'shiftKey';
            } else if (e.ctrlKey) {
                keyType = 'ctrlKey';
            }

            BomTable.clearSelected();

            Object.keys(this.dataMap).some(function (key) {
                if (_this12.dataMap[key] === el) {
                    keyMap = key.split('::');
                    return true;
                }
            });

            var _keyMap = keyMap,
                _keyMap2 = _slicedToArray(_keyMap, 2),
                colNum = _keyMap2[0],
                rowNum = _keyMap2[1];

            colNum = +colNum;
            rowNum = +rowNum;

            if (type === 'mousedown') {
                this.mouseDownElement = { el: el, colNum: colNum, rowNum: rowNum };
            }

            this._setActiveArea({
                start: {
                    colNum: this.mouseDownElement.colNum,
                    rowNum: this.mouseDownElement.rowNum
                },
                end: {
                    colNum: colNum,
                    rowNum: rowNum
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

    }, {
        key: '_setLastSelected',
        value: function _setLastSelected(el, colNum, rowNum) {
            if (this.lastSelected && this.lastSelected.el === el) return;

            return this.lastSelected = { el: el, colNum: colNum, rowNum: rowNum };
        }

        /**
         * Save and mark active area
         * @param {object} map
         * @param {string} keyType - 'shiftKey' | 'ctrlKey' | 'none'
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_setActiveArea',
        value: function _setActiveArea(map) {
            var _this13 = this;

            var keyType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'none';

            var startCol = map.start.colNum,
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
            for (var i = startRow; endRow >= i; i++) {
                rows.push(i);
            }

            // select only headers
            if (rows.length === 1 && rows[0] === -1) {
                // total rows length
                endRow = this.instanceData.length - 1;
                // select all rows
                rows = [];
                for (var _i = 0; endRow >= _i; _i++) {
                    rows.push(_i);
                }
            }

            // array cols
            for (var _i2 = startCol; endCol >= _i2; _i2++) {
                cols.push(_i2);
            }

            cols.forEach(function (col) {
                rows.forEach(function (row) {
                    if (row === -1) return;
                    var key = col + '::' + row;
                    if (_this13.selected.includes(key)) {
                        _this13.selected = _this13.selected.filter(function (s) {
                            return s !== key;
                        });
                    } else {
                        _this13.selected.push(key);
                    }
                    _this13.dataMap[key].classList.toggle('area');
                });
            });

            if (this.selected.length === 1) {
                var chunks = this.selected[0].split('::');
                this._setLastSelected(this.dataMap[this.selected[0]], +chunks[0], +chunks[1]);
            }

            this.lastSelectArea = { start: { col: startCol, row: startRow }, end: { col: endCol, row: endRow } };
            this._createSquare(endCol, endRow);
            return this;
        }

        /**
         * Clear active area
         * @return {BomTable}
         */

    }, {
        key: 'clearActiveArea',
        value: function clearActiveArea() {
            var _this14 = this;

            this.instanceData.length && this.getSelected().forEach(function (key) {
                var el = _this14.dataMap[key];
                el && el.classList.remove('area');
            });

            this.lastSelectArea = {};
            this.selected = [];
            this.lastSelected = null;

            return this;
        }

        /**
         * Create square
         * @param {number} endCol - end col
         * @param {number} endRow - end row
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_createSquare',
        value: function _createSquare(endCol, endRow) {
            var downRightTd = this.dataMap[endCol + '::' + endRow],
                rect = downRightTd.getBoundingClientRect();

            if (!this.dom.square) {
                this.dom.square = BomTable.createElement('div', 'bomtable-square', this.dom.wrapper);
            }

            this.dom.square.style.top = rect.bottom + w.pageYOffset + 'px';
            this.dom.square.style.left = rect.right + w.pageXOffset + 'px';

            return this;
        }

        /**
         * Remove square
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_removeSquare',
        value: function _removeSquare() {
            this.dom.square && this.dom.square.remove();
            this.dom.square = null;
            return this;
        }

        /**
         * Listener move square
         * @param {event} e
         * @private
         */

    }, {
        key: '_squareAreaListener',
        value: function _squareAreaListener(e) {
            var _this15 = this;

            var bottomRightSelectTr = this.dataMap[this.lastSelectArea.end.col + '::' + this.lastSelectArea.end.row],
                rectBRSTr = bottomRightSelectTr.getBoundingClientRect(),
                elMap = {},
                firstTd = void 0,
                firstRect = void 0,
                lastTd = void 0,
                lastRect = void 0,
                startCol = void 0,
                endCol = void 0,
                startRow = void 0,
                endRow = void 0;

            this.direction = {};

            Object.keys(this.dataMap).some(function (key) {
                var td = _this15.dataMap[key],
                    splitKey = void 0;

                if (td !== e.target) return false;

                splitKey = key.split('::');
                elMap.col = +splitKey[0];
                elMap.row = +splitKey[1];

                return true;
            });

            endCol = elMap.col;
            endRow = elMap.row;

            if (rectBRSTr.right > e.pageX + w.pageXOffset) {
                // left

                startCol = this.lastSelectArea.end.col;
                endCol = this.lastSelectArea.end.col;

                this.direction.x = 'left';

                if (startCol > elMap.col) {
                    startCol = elMap.col;
                }
            } else {
                // right

                this.direction.x = 'right';
                startCol = this.lastSelectArea.start.col;
            }

            if (startCol > this.lastSelectArea.start.col) {
                startCol = this.lastSelectArea.start.col;
            }

            if (rectBRSTr.top > e.pageY + w.pageYOffset) {
                // up

                startRow = this.lastSelectArea.start.row;
                endRow = this.lastSelectArea.end.row;

                this.direction.y = 'up';

                if (startRow > elMap.row) {
                    startRow = elMap.row;
                }
            } else {
                // down

                this.direction.y = 'down';
                startRow = this.lastSelectArea.start.row;
            }

            firstTd = this.dataMap[startCol + '::' + startRow];
            firstRect = firstTd.getBoundingClientRect();

            lastTd = this.dataMap[endCol + '::' + endRow];
            lastRect = lastTd.getBoundingClientRect();

            BomTable.clearSelected();

            this._renderSquareDragArea({
                left: firstRect.left - 1,
                top: firstRect.top - 1,
                bottom: lastRect.bottom - 1,
                right: lastRect.right - 1
            })._setSquareDragCell({ startCol: startCol, endCol: endCol, startRow: startRow, endRow: endRow });
        }

        /**
         * Draw drag area
         * @param position
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_renderSquareDragArea',
        value: function _renderSquareDragArea(position) {

            if (!this.dom.copyAreaLeft) {
                this.dom.copyAreaLeft = BomTable.createElement('div', 'bomtable-copy-area-left', this.dom.wrapper);
                this.dom.copyAreaRight = BomTable.createElement('div', 'bomtable-copy-area-right', this.dom.wrapper);
                this.dom.copyAreaTop = BomTable.createElement('div', 'bomtable-copy-area-top', this.dom.wrapper);
                this.dom.copyAreaBottom = BomTable.createElement('div', 'bomtable-copy-area-bottom', this.dom.wrapper);
            }

            this.dom.copyAreaLeft.style.top = position.top + w.pageYOffset + 'px';
            this.dom.copyAreaLeft.style.left = position.left + w.pageXOffset + 'px';
            this.dom.copyAreaLeft.style.height = position.bottom - position.top + 'px';

            this.dom.copyAreaRight.style.top = position.top + w.pageYOffset + 'px';
            this.dom.copyAreaRight.style.left = position.right + w.pageXOffset + 'px';
            this.dom.copyAreaRight.style.height = position.bottom - position.top + 'px';

            this.dom.copyAreaTop.style.top = position.top + w.pageYOffset + 'px';
            this.dom.copyAreaTop.style.left = position.left + w.pageXOffset + 'px';
            this.dom.copyAreaTop.style.width = position.right - position.left + 'px';

            this.dom.copyAreaBottom.style.top = position.bottom + w.pageYOffset + 'px';
            this.dom.copyAreaBottom.style.left = position.left + w.pageXOffset + 'px';
            this.dom.copyAreaBottom.style.width = position.right - position.left + 'px';

            return this;
        }

        /**
         * Draw square
         * @param {Object} map coords {startCol, endCol, startRow, endRow}
         * @return {BomTable}
         * @private
         */

    }, {
        key: '_setSquareDragCell',
        value: function _setSquareDragCell(map) {
            this.squareDragArea = [];

            for (var col = map.startCol; map.endCol >= col; col++) {
                for (var row = map.startRow; map.endRow >= row; row++) {
                    this.squareDragArea.push(col + '::' + row);
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

    }, {
        key: '_removeCopyArea',
        value: function _removeCopyArea() {
            var _this16 = this;

            var saveValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;


            this.dom.copyAreaLeft && this.dom.copyAreaLeft.remove();
            this.dom.copyAreaRight && this.dom.copyAreaRight.remove();
            this.dom.copyAreaTop && this.dom.copyAreaTop.remove();
            this.dom.copyAreaBottom && this.dom.copyAreaBottom.remove();

            this.dom.copyAreaLeft = this.dom.copyAreaRight = this.dom.copyAreaTop = this.dom.copyAreaBottom = null;

            if (saveValue && this.squareDragArea.length) {

                var tableData = {},
                    squareAreaData = {},
                    map = { start: { colNum: null, rowNum: null }, end: { colNum: null, rowNum: null } };

                this.getSelected().forEach(function (key) {
                    var rowNum = key.split('::')[1];
                    if (!tableData[rowNum]) tableData[rowNum] = [];
                    tableData[rowNum].push(key);
                });
                tableData = Object.values(tableData);

                this.squareDragArea.forEach(function (key) {
                    var rowNum = key.split('::')[1];
                    if (!squareAreaData[rowNum]) squareAreaData[rowNum] = [];
                    squareAreaData[rowNum].push(key);
                });
                squareAreaData = Object.values(squareAreaData);

                // if dif count set and selected cols or rows
                if (tableData.length !== squareAreaData.length || squareAreaData[0].length !== tableData[0].length) {

                    if (squareAreaData.length > tableData.length) {

                        var index = 0,
                            lengthData = tableData.length;
                        while (squareAreaData.length > tableData.length) {
                            if (this.direction.y === 'down') {
                                tableData.push(tableData[index++]);
                                if (index === lengthData) index = 0;
                            } else {
                                tableData.unshift(tableData[tableData.length - ++index]);
                            }
                        }
                    }

                    if (squareAreaData[0].length > tableData[0].length) {
                        tableData.forEach(function (row) {
                            var index = 0,
                                lengthData = tableData[0].length;
                            while (squareAreaData[0].length > row.length) {
                                if (_this16.direction.x === 'right') {
                                    row.push(row[index++]);
                                    if (index === lengthData) index = 0;
                                } else {
                                    row.unshift(row[row.length - ++index]);
                                }
                            }
                        });
                    }

                    squareAreaData.forEach(function (row, rowIndex) {
                        row.forEach(function (key, colIndex) {
                            var copyKey = tableData[rowIndex][colIndex],
                                _key$split5 = key.split('::'),
                                _key$split6 = _slicedToArray(_key$split5, 2),
                                colNum = _key$split6[0],
                                rowNum = _key$split6[1];


                            if (map.start.colNum === null || map.start.colNum > colNum) map.start.colNum = +colNum;
                            if (map.start.rowNum === null || map.start.rowNum > rowNum) map.start.rowNum = +rowNum;

                            if (map.end.colNum === null || colNum > map.end.colNum) map.end.colNum = +colNum;
                            if (map.end.rowNum === null || rowNum > map.end.rowNum) map.end.rowNum = +rowNum;

                            if (copyKey === key) return;

                            var _copyKey$split = copyKey.split('::'),
                                _copyKey$split2 = _slicedToArray(_copyKey$split, 2),
                                colCopyNum = _copyKey$split2[0],
                                rowCopyNum = _copyKey$split2[1],
                                val = _this16.getDataCell(+colCopyNum, +rowCopyNum);

                            _this16.setDataCell(+colNum, +rowNum, val);
                        });
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

    }, {
        key: '_createInput',
        value: function _createInput() {
            var setCellValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;


            if (!this.lastSelected || this.lastSelected.el.tagName !== 'TD') return;

            var td = this.lastSelected.el,
                tdRect = td.getBoundingClientRect(),
                textarea = BomTable.createElement('textarea', 'bomtable-input', this.dom.wrapper, {
                left: tdRect.left - 1 + 'px',
                top: tdRect.top - 1 + 'px',
                width: tdRect.width - 1 + 'px',
                height: tdRect.height - 1 + 'px'
            });

            if (setCellValue) {
                textarea.value = td.innerText;
            }

            textarea.focus();

            this.input = { el: textarea, colNum: this.lastSelected.colNum, rowNum: this.lastSelected.rowNum };

            return this._removeSquare();
        }

        /**
         * Remove table textarea
         * @param {boolean} saveValue - save value before remove textarea
         * @private
         */

    }, {
        key: '_removeInput',
        value: function _removeInput() {
            var saveValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;


            if (!this.input) return;

            var val = this.input.el.value,
                colNum = this.input.colNum,
                rowNum = this.input.rowNum;

            this.input.el.remove();
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
         * @return {BomTable}
         */

    }, {
        key: 'clear',
        value: function clear() {
            var _this17 = this;

            this.dom = {};
            this._removeInput(false);
            this._removeCopyArea(false);

            this.instanceData = [];
            this.instanceHeader = [];
            this.dataMap = {};

            this.lastSelectArea = {};
            this.dom && Object.keys(this.dom).forEach(function (nodeName) {
                _this17.dom[nodeName] && _this17.dom[nodeName].remove();
                delete _this17.dom[nodeName];
            });

            this.selected = [];
            this.lastSelected = null;

            this.lastHover = null;
            return this;
        }

        /**
         * 'destroy' and clear instance
         */

    }, {
        key: 'destroy',
        value: function destroy() {

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

        /**
         * **** static methods ****
         */

        /**
         * Create new HTML element
         * @param {string} tagName - name created tag
         * @param {string} selector - css selectors ('class1 class2...')
         * @param {HTMLElement} parent - parent of new tag
         * @param {Object} css - css styles
         * @return {HTMLElement}
         */

    }], [{
        key: 'createElement',
        value: function createElement(tagName) {
            var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var css = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

            var el = d.createElement(tagName);
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

    }, {
        key: '_likeArray',
        value: function _likeArray(HTMLCollection) {
            return Array.prototype.slice.call(HTMLCollection);
        }

        /**
         * Get node element parents
         * @param {Node} el
         * @return {Array}closeMenu
         */

    }, {
        key: 'parents',
        value: function parents(el) {
            var els = [];
            while (el && el.tagName !== 'BODY') {
                els.unshift(el);
                el = el.parentNode;
            }
            return els;
        }
    }, {
        key: 'clearSelected',


        /**
         * Clear selected area
         */
        value: function clearSelected() {
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
    }]);

    return BomTable;
}();

exports.default = BomTable;

/***/ })
/******/ ]);