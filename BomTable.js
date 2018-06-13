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
            data: [],
            header: '', // заголовок таблицы
            groups: [],
            tableClass: '', // класс таблицы
            container: null, // класс контейнера куда будет добавлена таблицы '.example'
            rowsClass: '', // класс для строк таблицы
            colsClass: '', // класс для столбцов таблицы

            // контекстное меню - массив объектов
            // [{"name": "Наименование", "action": "name", "class": "name"}, {"name": "H1", "action": "h1", "class": "h"}]
            contextMain: ''
        }, opts);


        return this.ini();
    }

    ini() {
        window.BomTable = this;
        this.instanceData = [];
        this.instanceHeader = [];
        this.dataMap = {};
        this.dom = {};
        this.render();

        d.addEventListener('mousedown', this.onmousedown.bind(this));
        d.addEventListener('mouseup', this.onmouseup.bind(this));

        d.addEventListener('mouseover', this.onmouseover.bind(this));
        d.addEventListener('click', this.onclick.bind(this));

        return this;
    }

    setData(data) {
        if (!Array.isArray(data)) throw new Error('Data must be array');
        this.config.data = data;
        this.prepareData(data).render();
    }

    getData() {
        return this.config.data;
    }

    /**
     * Prepare data (add empty value in short columns) and set copy data in instance
     * @param data
     */
    prepareData(data) {
        let countCols = data.reduce((max, arr) => max > arr.length ? max : arr.length, 0);
        data.forEach(col => {
            col = col.slice(0); // copy array
            while (countCols > col.length) col.push('');
            this.instanceData.push(col);
        });
        return this;
    }

    prepareHeader(header) {
        if (!header || !header.length) {
            this.instanceHeader = [];
            return;
        }
        while (this.instanceData[0].length > header.length) header.push('');
        this.instanceHeader = header;
    }

    render() {
        let head = '',
            rowsClass = this.config.rowsClass,
            colsClass = this.config.colsClass;

        // create table
        this.dom.table = d.createElement('table');
        this.dom.table.classList.add('bomtable');
        this.config.tableClass && this.dom.table.classList.add(this.config.tableClass);

        this.prepareData(this.config.data);
        this.prepareHeader(this.config.header);

        if (!this.dom.header && this.instanceHeader.length) {
            this.dom.header = d.createElement('thead');
        }
        this.instanceHeader.forEach(i => head += `<th>${i}</th>`);

        if (head) {
            this.dom.header.innerHTML = `<tr class="${colsClass}">${head}</tr>`;
        } else {
            this.removeHeader();
        }

        this.dom.header && this.dom.table.appendChild(this.dom.header);

        this.dom.body = d.createElement('tbody');
        this.dom.table.appendChild(this.dom.body);

        this.instanceData.forEach((col, colNum) => {
            let tr = d.createElement('tr');
            colsClass && tr.classList.add(colsClass);

            col.forEach((cell, rowNum) => {
                let td = d.createElement('td');
                rowsClass && tr.classList.add(rowsClass);
                td.innerHTML = cell;

                tr.appendChild(td);
                this.dataMap[`${colNum}::${rowNum}`] = td;
            });

            this.dom.body.appendChild(tr);
        });

        if (!this.dom.container) {
            this.dom.container =
                typeof this.config.container === 'string'
                    ? d.querySelector(this.config.container)
                    : this.config.container;

            this.dom.container.appendChild(this.dom.table);
        }

    }

    removeHeader() {
        this.dom.header && this.dom.header.remove();
        this.dom.header = null;
    }

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

    onmousedown(e) {
        let el = e.target;
        if (!BomTable.parents(el).some(p => p === this.dom.table)) return;
        this.mouseBtnPressed = 1;

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        this.setActiveCell(el);
    }

    onmouseup() {
        this.mouseBtnPressed = 0;
    }

    onmouseover(e) {
        let el = e.target;

        if (!this.mouseBtnPressed) return;

        if (!['TD', 'TH'].includes(el.tagName)) {
            return;
        }

        this.setActiveCell(el);

        BomTable.clearSelected();
    }

    /**
     *
     * @param el - HTMLNode
     * @return {{el: *, colNum: *, rowNum: *}}
     */
    setActiveCell(el) {
        let keyMap;

        BomTable.clearSelected();

        Object.keys(this.dataMap).some(key => {
            if (this.dataMap[key] === el) {
                keyMap = key.split('::');
                return true;
            }
        });

        let [colNum, rowNum] = keyMap;

        return this.lastSelected = {el, colNum, rowNum};
    }

    onclick(e) {
        let el = e.target,
            colNum,
            rowNum;
        Object.keys(this.dataMap).some(key => {
            if (this.dataMap[key] === el) {
                [colNum, rowNum] = key.split('::');
                return true;
            }
        });

        this.lastSelected = {el, colNum, rowNum};
    }

}