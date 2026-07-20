// noinspection JSUnusedGlobalSymbols

import * as helper from './helper.ts'
import { _splitKey } from './helper.ts'
import { History } from './History.ts'

export type TBomTable = InstanceType<typeof BomTable>
export type TCellValue = string | number | null

type TBomTableTd = HTMLTableCellElement & { bomtableValType: string, bomtableKey: string }

export interface TBomtableOptions {
    data: TCellValue[][]
    header?: TCellValue[]
    stickyHeader?: boolean
    tableClass?: string
    touchSupport?: boolean
    container: string | HTMLElement
    rowsClass?: string
    colsClass?: string

    useHistory?: boolean
    colsResize?: boolean

    contextMenu?: {
        items: Record<string, string>
        callback: (action: string, instance: TBomTable, event: MouseEvent | KeyboardEvent, lastSelected: {
            colNum?: number | null
            rowNum?: number | null
        }) => void
    }

    hooks?: {
        beforeHeaderMenuRender?: (instance: TBomTable, menu: Record<string, string>) => void
        beforeContextMenuRender?: (instance: TBomTable, menu: Record<string, string>) => void
        afterTdRender?: (instance: TBomTable, td: TBomTableTd, colNum: number, rowNum: number, cell: TCellValue, meta: Record<string, any>) => void
    }

    headerMenu?: {
        items: Record<string, string>
        callback: () => void
    }
}

type TDocumentHandlersName
    = '_oncontextmenu'
        | '_onkeydown'
        | '_ontouchstart'
        | '_ontouchend'
        | '_ontouchmove'
        | '_onmousedown'
        | '_onmouseup'

type TContainerHandlersName
    = '_onContainerscroll'
        | '_onContainerdblclick'
        | '_onContainermousemove'
        | '_onContainermouseover'

type TMenuName = 'contextMenu' | 'headerMenu'

export class BomTable {
    // public
    destroyed: boolean = false

    // private
    #config: TBomtableOptions

    #minColWidth = 60
    #isTouch = false
    #key = ''

    #History: null | InstanceType<typeof History> = null

    #handlers: Partial<Record<TDocumentHandlersName, (e: any) => void>> = {}

    #instanceData: TCellValue[][] = []
    #instanceHeader: TCellValue[] = []

    #dataMap: Record<string, TBomTableTd> = {}
    #cellMeta: Record<string, any> = {}

    #container?: HTMLElement & { instanceKey: string }

    #dom: {
        wrapper?: HTMLElement
        table?: HTMLTableElement
        copyTable?: HTMLTableElement
        rows?: Record<string, HTMLElement>
        body?: HTMLElement
        header?: HTMLElement
        copyHeader?: HTMLElement
        colgroup?: HTMLElement
        copyColgroup?: HTMLElement
        buffer?: HTMLTextAreaElement
        colResizer?: HTMLElement
        square?: HTMLElement
        colResizerLine?: HTMLElement
        contextMenu?: HTMLElement
        headerMenu?: HTMLElement
        input?: {
            el: HTMLTextAreaElement
            colNum: number
            rowNum: number
        }
        elHelper?: HTMLTextAreaElement
        contextBtn?: HTMLElement
        activeAreaLeft?: HTMLElement
        activeAreaRight?: HTMLElement
        activeAreaTop?: HTMLElement
        activeAreaBottom?: HTMLElement
        copyAreaLeft?: HTMLElement
        copyAreaRight?: HTMLElement
        copyAreaTop?: HTMLElement
        copyAreaBottom?: HTMLElement
    } = {}

    #selected: string[] = []
    #lastSelected: { el?: HTMLElement, rowNum?: number, colNum?: number } | null = null
    #lastSelectArea: { start: { col: number, row: number }, end: { col: number, row: number } } | null = null

    #manualColSize: Record<string, number> = {}

    #mouseDownElement: { el: HTMLElement, colNum: number, rowNum: number } | null = null

    #touchStartPoint: { x?: number, y?: number } = {}
    #direction: { x: 'left' | 'right' | '', y: 'up' | 'down' | '' } = { x: '', y: '' }

    #countTouch: number = 0

    #tapped: HTMLElement | null = null
    #lastHover: HTMLElement | null = null

    #mouseBtnPressed: boolean = false
    #squarePressed: boolean = false
    #colResizerPressed: boolean = false
    #colResizerPressedIndex: number | null = null

    #tapTimeout: ReturnType<typeof setTimeout> = 0
    #containerScrollTimeout: ReturnType<typeof setTimeout> = 0

    #squareDragArea: string[] = []

    constructor(opts: TBomtableOptions) {
        /**
         * Config
         */
        this.#config = Object.assign(
            {
                data: [], // data for table body
                header: null, // table header
                stickyHeader: true, // sticky table header
                tableClass: '', // css class table
                touchSupport: true, // support touch in browsers
                container: null, // node or selector for mount table
                rowsClass: '', // css class for table rows
                colsClass: '', // css class for table cols

                useHistory: true, // use state history
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
                        unionCols: 'union cols',
                        hr2: '',
                        undo: 'undo',
                        redo: 'redo',
                    },
                    callback: null, // function can be call after click context menu item
                },

                hooks: {},
                // header menu, cooking like context menu
                headerMenu: null,
            },
            opts,
        )

        this.#isTouch = Boolean(this.#config.touchSupport && 'ontouchstart' in window)
        this.#key = helper.randKey()

        this.#ini()

        if (this.#config.useHistory) {
            this.#History = new History(this, (params: {
                data?: TCellValue[][]
                header?: TCellValue[]
            }) => {
                if (params.data) {
                    this.#config.data = params.data
                    this.clear().#render().#renderHelpers()
                }

                if (params.header) {
                    this.#config.header = params.header
                    this.removeHeader().#renderHeader().render()
                }

                const ls = this.#lastSelected
                if (ls && ((ls.colNum || 0) > this.getDataRow(0).length - 1 || (ls.rowNum || 0) > this.getDataCol(0).length - 1)) {
                    this.clearActiveArea()
                } else if (ls || this.#lastSelectArea) {
                    this.#rerenderActiveArea()
                }
            })
        }

        return this
    }

    /**
     * Initialization
     */
    #ini(): TBomTable {
        return this.clear().#render().#callListeners()
    }

    /**
     * Add event listeners
     */
    #callListeners(): TBomTable {
        const events = ['contextmenu', 'keydown']

        if (this.#isTouch) {
            events.push('touchstart')
            events.push('touchend')
            events.push('touchmove')
        } else {
            events.push('mousedown')
            events.push('mouseup')
        }

        events.forEach(event => {
            const opts = ['touchstart', 'touchmove', 'touchend'].includes(event)
                ? {
                        passive: false,
                        cancelable: true,
                    }
                : undefined

            const _event: TDocumentHandlersName = `_on${event}` as TDocumentHandlersName
            this.#handlers[_event] = this[_event].bind(this)
            document.addEventListener(event, this.#handlers[_event], opts)
        })

        return this.#renderHelpers()
    }

    /**
     * Set new data
     */
    setData(data: TCellValue[][]) {
        if (!Array.isArray(data)) {
            throw new TypeError('Data must be an array')
        }
        this.#config.header = this.getHeader()
        this.#config.data = data
        this.#History && this.#History.push('setData')
        this.clear().#render().#renderHelpers()
    }

    /**
     * Get table data
     */
    getData(): TCellValue[][] {
        return this.#instanceData
    }

    /**
     * Set new header
     */
    setHeader(header: TCellValue[]) {
        if (header && !Array.isArray(header)) {
            throw new Error('Header must be an array')
        }
        this.#config.header = header
        this.#History && this.#History.push('setHeader')
        this.#renderHeader().render()
    }

    /**
     * Get table header
     */
    getHeader(): TCellValue[] {
        return this.#instanceHeader
    }

    /**
     * Set new cell value
     */
    setDataCell({ col, row, val }: { col: number, row: number, val: TCellValue }) {
        this.#setDataCell({ col, row, val }).#rerenderActiveArea()
        this.#History && this.#History.push('setDataCell')
    }

    /**
     * Set new cell value
     */
    #setDataCell({ col, row, val }: { col: number, row: number, val: TCellValue }): TBomTable {
        const td = this.#dataMap[`${col}::${row}`]
        const prevVal = this.#instanceData[row][col]
        const valType = typeof val

        if (td.bomtableValType === valType && val === prevVal) {
            return this
        }

        td.bomtableValType = valType
        td.innerHTML = this.#instanceData[row][col] = String(helper.prepareValue(val || ''))
        return this
    }

    /**
     * Get cell value
     */
    getDataCell(col: number, row: number): TCellValue {
        return this.#instanceData[row][col]
    }

    /**
     * Set any data for cell by prop name
     */
    setMetaDataCell({ col, row, propName, val }: { col: number, row: number, propName: string, val: any }) {
        const el = this.#dataMap[`${col}::${row}`]
        const key = el.bomtableKey
        if (!this.#cellMeta[key]) {
            this.#cellMeta[key] = {}
        }
        this.#cellMeta[key][propName] = val
    }

    /**
     * Get cell metadata by prop name
     */
    getMetaDataCell({ col, row, propName }: { col: number, row: number, propName: string }) {
        const el = this.#dataMap[`${col}::${row}`]
        if (!el) {
            return undefined
        }
        const key = el.bomtableKey
        if (!this.#cellMeta[key]) {
            return undefined
        }
        return this.#cellMeta[key][propName]
    }

    /**
     * Delete cell meta data
     */
    removeMetaDataCell({ col, row, propName }: { col: number, row: number, propName: string }) {
        const el = this.#dataMap[`${col}::${row}`]
        const key = el.bomtableKey
        if (!this.#cellMeta[key]) {
            return
        }
        delete this.#cellMeta[key][propName]
    }

    /**
     * Set new row data
     */
    setDataRow({ row, data }: { row: number, data: TCellValue[] }) {
        if (!this.#instanceData[row]) {
            return
        }
        this.#instanceData[row].forEach((cell, cellIndex) => {
            const newVal = data[cellIndex] !== undefined ? helper.prepareValue(data[cellIndex]) : ''
            if (newVal === cell) {
                return
            }
            this.#dataMap[`${cellIndex}::${row}`]!.innerHTML = newVal ? newVal.toString() : ''
            this.#instanceData[row][cellIndex] = newVal
        })

        this.#rerenderActiveArea()
    }

    /**
     * Get row by index
     */
    getDataRow(row: number): TCellValue[] {
        return this.#instanceData[row]
    }

    /**
     * Set new col data
     */
    setDataCol({ col, data }: { col: number, data: TCellValue[] }) {
        this.#instanceData.forEach((row, rowIndex) => {
            const newVal = data[rowIndex] !== undefined ? helper.prepareValue(data[rowIndex]) : ''
            const cell = row[col]
            if (newVal === cell) {
                return
            }
            this.#dataMap[`${col}::${rowIndex}`]!.innerHTML = newVal ? newVal.toString() : ''
            this.#instanceData[rowIndex][col] = newVal
        })

        this.#rerenderActiveArea()
    }

    /**
     * Get col by index
     */
    getDataCol(col: number): TCellValue[] {
        return this.#instanceData.map(row => row[col])
    }

    /**
     * Get selected map
     */
    getSelectedMap(): string[] {
        return this.#selected.sort()
    }

    /**
     * Get data from selected items
     */
    getSelectedData(): TCellValue[][] {
        const data: Record<string, TCellValue[]> = {}

        this.getSelectedMap().forEach(key => {
            const [colNum, rowNum] = helper._splitKey(key)
            if (!data[rowNum]) {
                data[rowNum] = []
            }
            data[rowNum].push(this.#instanceData[rowNum][colNum])
        })

        return Object.values(data)
    }

    /**
     * Prepare data (add empty value in short columns) and set copy data in the instance
     */
    #prepareData(data: TCellValue[][]) {
        const countCols = data.reduce((max, arr) => Math.max(max, arr.length), 0)
        data.forEach(col => {
            col = col.map(cell => helper.prepareValue(cell))
            while (countCols > col.length) {
                col.push('')
            }
            this.#instanceData.push(col)
        })
        return this
    }

    /**
     * Prepare header table
     */
    #prepareHeader(header?: TCellValue[]) {
        if (!header || !header.length) {
            this.#instanceHeader = []
            return
        }
        while (this.#instanceData[0].length > header.length) {
            header.push('')
        }
        header.length = this.#instanceData[0].length
        this.#instanceHeader = header
    }

    /**
     * Create table row
     */
    #createRow({ index = -1, rowData = [], render = false }: {
        index?: number
        rowData?: TCellValue[]
        render?: boolean
    }): HTMLElement {
        if (!this.#dom.rows) {
            this.#dom.rows = {}
        }
        const nextTr = this.#dom.rows[index]
        const tableBody = this.#dom.body!
        const length = this.#instanceData.length ? this.#instanceData[0].length : this.#instanceHeader.length

        const tr = helper.createElement({ tagName: 'tr', selector: this.#config.rowsClass })

        for (let colNum = 0; colNum < length; colNum++) {
            const cell = rowData[colNum] != null ? helper.prepareValue(rowData[colNum]) : ''
            const td = helper.createElement({
                tagName: 'td',
                selector: this.#config.colsClass,
                parent: tr,
                html: String(cell),
            })
            Object.assign(td, {
                bomtableValType: typeof cell,
                bomtableKey: helper.randKey(),
            })
        }

        if (nextTr) {
            const tmp: Record<string, HTMLElement> = {}
            Object.keys(this.#dom.rows || {}).forEach(rowIndex => {
                const _rowIndex = Number.parseFloat(rowIndex)
                if (_rowIndex < index) {
                    tmp[_rowIndex] = this.#dom.rows![_rowIndex]
                } else if (_rowIndex === +index) {
                    tmp[index] = tr
                    tmp[_rowIndex + 1] = this.#dom.rows![_rowIndex]
                } else {
                    tmp[_rowIndex + 1] = this.#dom.rows![_rowIndex]
                }
            })
            this.#dom.rows = tmp
        } else {
            this.#dom.rows[index] = tr
        }

        if (!render) {
            return tr
        }

        if (nextTr) {
            tableBody.insertBefore(tr, nextTr)
        } else {
            tableBody.appendChild(tr)
        }

        return tr
    }

    /**
     * AddNew row in table
     */
    addRow(): TBomTable {
        const index = (this.#lastSelected ? this.#lastSelected.rowNum : this.#instanceData.length) as number
        this.#addRow(index)
        this.#History && this.#History.push('addRow')
        return this
    }

    /**
     * Add new row in table
     */
    #addRow(index: number): TBomTable {
        this.#createRow({ index, render: true })

        Object.keys(this.#dataMap).forEach(key => {
            this.#dataMap[key].classList.remove('area')
        })

        this.#removeSquares()
        return this.#reindex()
    }

    /**
     * Add new col
     */
    addCol(): TBomTable {
        const index = this.#lastSelected?.colNum ?? 0
        this.#addCol(index)
        this.#History && this.#History.push('addCol')
        return this
    }

    /**
     * Add new col
     */
    #addCol(index?: number | null): TBomTable {
        const colsClass = this.#config.colsClass || ''
        const col = helper.createElement({ tagName: 'col' })
        const copyCol = col.cloneNode(false)

        let lastColIndex
        let it = 0

        if (index != null) {
            Object.keys(this.#dataMap).forEach(key => {
                if (key.indexOf(`${index}::`) !== 0) {
                    return
                }

                const el = this.#dataMap[key]
                const parent = el.parentElement
                const rowNum = +key.split('::')[1]
                const isHeader = rowNum < 0
                const isCopyHeader = rowNum === -2
                const child = isHeader
                    ? this.#createHeaderCell('', isCopyHeader)
                    : helper.createElement({ tagName: 'td' })

                if (!isHeader) {
                    Object.assign(child, {
                        bomtableValType: 'string',
                        bomtableKey: helper.randKey(),
                    })
                    colsClass && child.classList.add(colsClass)
                }
                parent!.insertBefore(child, el.nextSibling)
            })
            if (this.#dom.colgroup) {
                this.#dom.colgroup.insertBefore(col, this.#dom.colgroup!.children[index].nextSibling)
            }
            if (this.#dom.copyColgroup) {
                this.#dom.copyColgroup!.insertBefore(copyCol, this.#dom.copyColgroup!.children[index].nextSibling)
            }
            this.#manualColSize = {}
        } else {
            if (this.#dom.colgroup) {
                this.#dom.colgroup.appendChild(col)
            }
            if (this.#dom.copyColgroup) {
                this.#dom.copyColgroup.appendChild(copyCol)
            }
            if (this.#dom.header) {
                this.#createHeaderCell() && this.#createHeaderCell('', true)
            }
            lastColIndex = this.#instanceData[0].length - 1
            while (it !== this.#instanceData.length) {
                const td = helper.createElement({
                    tagName: 'td',
                    selector: colsClass,
                    parent: this.#dataMap[`${lastColIndex}::${it++}`].parentElement,
                })
                Object.assign(td, {
                    bomtableValType: 'string',
                    bomtableKey: helper.randKey(),
                })
            }
        }

        return this.#reindex().#setContainerWidth().#calcColsWidth()
    }

    /**
     * Remove get or selected rows
     * @param nums - index removes rows, if array is empty - selected rows will be removed
     */
    removeRows(nums: number[] = []): TBomTable {
        const rows: number[] = nums.length ? nums : this.getSelectedRows()
        const tmp: number[] = []

        rows.forEach(rowNum => {
            const firstTd = this.#dataMap[`0::${rowNum}`]
            const parentTr = firstTd && firstTd.parentNode
            if (!parentTr) {
                return
            }
            tmp.push(rowNum)
        })

        this.#removeRows(tmp)
        this.#History && this.#History.push('removeRows')
        return this
    }

    /**
     * Remove rows
     * @param rows - index removes rows
     */
    #removeRows(rows: number[]): TBomTable {
        if (!rows.length) {
            return this
        }
        rows.forEach(rowNum => {
            const parentTr = this.#dataMap[`0::${rowNum}`].parentNode as HTMLElement
            ;[...parentTr.children].forEach(td => delete this.#cellMeta[(td as TBomTableTd).bomtableKey])
            helper.removeElement(parentTr)
        })
        return this.#reindex()
    }

    /**
     * Remove get cols or selected cols
     * @param nums - index removes cols, if array is empty - selected cols will be removed
     */
    removeCols(nums: number[] = []): TBomTable {
        const cols = nums.length ? nums : this.getSelectedCols()
        this.#removeCols(cols)
        this.#History && this.#History.push('removeCols')
        return this
    }

    /**
     * Remove cols
     * @param cols - index removes cols
     */
    #removeCols(cols: number[]): TBomTable {
        if (!cols.length) {
            return this
        }
        cols.forEach(colNum => {
            Object.keys(this.#dataMap).forEach(key => {
                if (!key.indexOf(`${colNum}::`)) {
                    const el = this.#dataMap[key]
                    const header = this.#dataMap[`${colNum}::-1`]
                    const copyHeader = this.#dataMap[`${colNum}::-2`]

                    if (el) {
                        delete this.#cellMeta[el.bomtableKey]
                        helper.removeElement(el)
                    }
                    header && helper.removeElement(header)
                    copyHeader && helper.removeElement(copyHeader)
                }
            })
            if (this.#dom.header) {
                helper.removeElement(this.#dom.colgroup!.children[colNum] as HTMLTableColElement)
                helper.removeElement(this.#dom.copyColgroup!.children[colNum] as HTMLTableColElement)
            }
        })
        this.#manualColSize = {}

        this.#reindex().#setContainerWidth().#calcColsWidth()
        return this
    }

    /**
     * Union rows
     * @param nums - index unions rows, if array is empty - selected rows will be unions
     */
    unionRows(nums: number[] = []): TBomTable {
        const rows = nums.length ? nums : this.getSelectedRows()

        if (rows.length === 1) {
            return this
        }

        const firstRowIndex = rows.shift()!
        const data = this.getData()
        const fistRow = data[firstRowIndex]

        rows.forEach(rowIndex => {
            data[rowIndex]
            && data[rowIndex].forEach((cell, colIndex) => {
                const newValue = helper.mergeValues(fistRow[colIndex], cell)
                fistRow[colIndex] = newValue
                ;(this.#dataMap[`${colIndex}::${firstRowIndex}`] as TBomTableTd).innerHTML = String(newValue)
            })
            helper.removeElement(this.#dom.rows?.[rowIndex])
        })

        this.#reindex()

        this.#History && this.#History.push('unionRows')
        return this
    }

    /**
     * Union cols
     * @param nums - index unions cols, if array is empty - selected cols will be unions
     */
    unionCols(nums: number[] = []): TBomTable {
        const cols = nums.length ? nums : this.getSelectedCols()

        if (cols.length === 1) {
            return this
        }

        const firstColNum = cols.shift()!
        const data = this.getData()
        const header = this.getHeader().filter((_, num) => !cols.includes(num))

        data.forEach((row, rowNum) => {
            let firstVal = ''
            const newRow: string[] = []
            row.forEach((cell, colNum) => {
                const _cell = cell ? cell.toString().trim() : ''

                if (cols.includes(colNum) && firstVal !== _cell) {
                    if (!newRow[firstColNum]) {
                        newRow[firstColNum] = ''
                    }
                    newRow[firstColNum] += ` ${_cell}`
                }

                if (_cell && firstColNum === colNum) {
                    firstVal = _cell
                }

                !cols.includes(colNum) && newRow.push(_cell)
            })

            data[rowNum] = newRow
        })

        this.#config.data = data
        this.#config.header = header
        this.clear().#render().#renderHelpers()

        this.#History && this.#History.push('unionCols')
        return this
    }

    /**
     * undo
     */
    undo(): TBomTable {
        if (!this.#History) {
            return this
        }
        this.#History.undo()
        return this
    }

    /**
     * redo
     */
    redo(): TBomTable {
        if (!this.#History) {
            return this
        }
        this.#History.redo()
        return this
    }

    /**
     * Get index of selected rows
     * @return {[]}
     */
    getSelectedRows(): number[] {
        const rows = new Set<number>(this.getSelectedMap().map(key => _splitKey(key)[1]))
        return [...rows.values()]
    }

    /**
     * Get index of selected cols
     * @return {[]}
     */
    getSelectedCols(): number[] {
        const cols = new Set<number>(this.getSelectedMap().map(key => _splitKey(key)[0]))
        return [...cols.values()]
    }

    /**
     * Public render +
     */
    public render(): TBomTable {
        const renders = this.#config.hooks?.afterTdRender

        this.#instanceData.forEach((row, rowNum) => {
            row.forEach((cell, colNum) => {
                const td = this.#dataMap[`${colNum}::${rowNum}`]
                const meta = this.#cellMeta[td.bomtableKey] || {}
                if (td.innerHTML !== cell) {
                    td.innerHTML = String(cell)
                }
                renders && renders(this, td, colNum, rowNum, row[colNum], meta)
            })
        })

        this.#instanceHeader.forEach((cell, colNum) => {
            const th = this.#dataMap[`${colNum}::-1`]
            const thc = this.#dataMap[`${colNum}::-2`]
            const childWrap = ([...th.children[0].children] as HTMLElement[])
                .find(c => c.classList.contains('bomtable-header-cell-wrap'))
            const val = childWrap?.innerHTML ?? ''
            if (childWrap && cell !== val) {
                childWrap.innerHTML = val
                thc.innerHTML = th.innerHTML
                renders && renders(this, thc, colNum, -2, val, {})
            }
        })

        return this.#setContainerWidth().#calcColsWidth().#rerenderActiveArea()
    }

    /**
     * Calculate columns width
     */
    #calcColsWidth(): TBomTable {
        if (!this.#dom.colgroup || !this.#instanceData[0] || !this.#dom.table) {
            return this
        }
        this.#dom.table.style.width = 'auto'
        const hasHeader = this.#dom.header
        const colGroupChildren = [...this.#dom.colgroup.children] as HTMLTableColElement[]
        const copyColGroupChildren = this.#dom.copyColgroup ? [...this.#dom.copyColgroup.children] as HTMLTableColElement[] : null
        hasHeader && this.#dom.header!.classList.remove('bomtable-hidden')
        this.#instanceData[0].forEach((_, colNum) => {
            const width = String(this.#getColWidth(colNum))
            colGroupChildren[colNum].width = width
            if (copyColGroupChildren) {
                copyColGroupChildren[colNum].width = width
            }
        })
        hasHeader && this.#dom.header!.classList.add('bomtable-hidden')
        this.#dom.table.style.width = ''
        return this
    }

    /**
     * Create new index DOM
     */
    #reindex(): TBomTable {
        const renders = this.#config.hooks?.afterTdRender

        this.#dom.rows = {}
        this.#dataMap = {}
        this.#instanceData = []

        this.#instanceHeader = []

        if (this.#dom.header && this.#dom.header.firstElementChild) {
            ;(['header', 'copyHeader'] as const).forEach(h => {
                if (!this.#dom[h]?.firstElementChild) {
                    return
                }
                ;[...this.#dom[h].firstElementChild.children].forEach((th, colNum) => {
                    const childWrap = [...th.children[0].children]
                        .find(c => c.classList.contains('bomtable-header-cell-wrap')) as HTMLElement | undefined
                    const val = childWrap?.innerHTML ?? ''
                    const rowIndex = h === 'copyHeader' ? -2 : -1
                    this.#dataMap[`${colNum}::${rowIndex}`] = th as TBomTableTd
                    if (rowIndex === -1) {
                        this.#instanceHeader.push(val)
                    } else if (renders) {
                        renders(this, (th as TBomTableTd), colNum, rowIndex, val, {})
                    }
                })
            })
        }

        if (this.#dom.body && this.#dom.body.children) {
            if (!this.#dom.rows) {
                this.#dom.rows = {}
            }
            ;[...this.#dom.body.children].forEach((tr, rowNum) => {
                this.#dom.rows![rowNum] = tr as HTMLElement
                this.#instanceData[rowNum] = []
                ;[...tr.children].forEach((td, colNum) => {
                    const _td = td as TBomTableTd
                    const meta = this.#cellMeta[_td.bomtableKey] || {}
                    let val: string | number = _td.innerHTML
                    if (_td.bomtableValType === 'number') {
                        val = +val
                    }
                    this.#dataMap[`${colNum}::${rowNum}`] = _td
                    this.#instanceData[rowNum].push(val)
                    renders && renders(this, _td, colNum, rowNum, val, meta)
                })
            })
        }

        return this
    }

    /**
     * Render table
     */
    #render(): TBomTable {
        const renders = this.#config.hooks?.afterTdRender

        this.#dom.table = helper.createElement({
            tagName: 'table',
            selector: 'bomtable',
        }) as HTMLTableElement

        if (this.#config.tableClass) {
            this.#dom.table.classList.add(this.#config.tableClass)
        }

        if (this.#config.headerMenu) {
            this.#dom.table.classList.add('bomtable-header-menu')
        }

        this.#prepareData(this.#config.data)

        if (!this.#instanceData[0]) {
            return this
        }

        if (!this.#dom.wrapper) {
            this.#dom.colgroup = helper.createElement({
                tagName: 'colgroup',
                parent: this.#dom.table,
            })

            this.#instanceData[0].forEach(() => {
                helper.createElement({ tagName: 'col', parent: this.#dom.colgroup })
            })
        }

        if (!this.#dom.wrapper) {
            this.#renderContainer()
        }

        this.#renderHeader()
        this.#dom.body = helper.createElement({
            tagName: 'tbody',
            parent: this.#dom.table,
            selector: 'building',
        })

        this.#instanceData.forEach((row, rowNum) => {
            const tr = this.#createRow({ index: rowNum, rowData: row, render: true })
            tr.childNodes.forEach((td, colNum) => {
                renders && renders(this, (td as TBomTableTd), colNum, rowNum, row[colNum], {})
                this.#dataMap[`${colNum}::${rowNum}`] = (td as TBomTableTd)
            })
        })

        this.#container!.instanceKey = this.#key
        this.#container!.style.opacity = '0'
        setTimeout(() => {
            if (!this.#dom.wrapper) {
                return
            }
            this.#setContainerWidth().#calcColsWidth()
            this.#dom.body!.classList.remove('building')
            this.#container!.style.opacity = ''
        }, 5)

        return this
    }

    /**
     * Render table container
     */
    #renderContainer(): TBomTable {
        if (this.destroyed) {
            return this
        }

        const container: HTMLElement | null
            = typeof this.#config.container === 'string'
                ? document.querySelector(this.#config.container)
                : this.#config.container

        if (!container?.style) {
            return this
        }

        this.#container = Object.assign(container, { instanceKey: this.#key })

        this.#dom.wrapper = helper.createElement({
            tagName: 'div',
            selector: 'bomtable-wrapper',
            parent: this.#container,
        })

        this.#isTouch && this.#dom.wrapper.classList.add('touched')

        this.#dom.wrapper.appendChild(this.#dom.table!)

        this.#container.style.position = 'relative'
        this.#container.style.overflow = 'auto'

        ;['scroll', 'dblclick', 'mousemove', 'mouseover'].forEach(event => {
            const _event: TContainerHandlersName = `_onContainer${event}` as TContainerHandlersName
            this.#container!.addEventListener(event as any, this[_event].bind(this))
        })

        return this
    }

    /**
     * Render table header
     */
    #renderHeader(): TBomTable {
        if (!this.#instanceData[0]) {
            return this
        }

        const renders = this.#config.hooks?.afterTdRender
        this.#prepareHeader(this.#config.header)

        if (!this.#dom.header && this.#instanceHeader.length) {
            this.#dom.header = helper.createElement({
                tagName: 'thead',
                selector: 'bomtable-hidden',
            })
            helper.createElement({ tagName: 'tr', parent: this.#dom.header })

            this.#dom.copyHeader = helper.createElement({ tagName: 'thead' })
            helper.createElement({ tagName: 'tr', parent: this.#dom.copyHeader })

            if (!this.#dom.copyTable) {
                this.#dom.copyTable = helper.createElement({
                    tagName: 'table',
                    selector: 'bomtable bomtable-copy-table',
                }) as HTMLTableElement
                if (this.#config.tableClass) {
                    this.#dom.copyTable!.classList.add(this.#config.tableClass)
                }
                if (this.#config.headerMenu) {
                    this.#dom.copyTable!.classList.add('bomtable-header-menu')
                }
                this.#dom.wrapper!.prepend(this.#dom.copyTable)
            }
            this.#config.stickyHeader && this.#dom.copyTable!.classList.add('sticky')

            if (!this.#dom.copyColgroup) {
                this.#dom.copyColgroup = helper.createElement({
                    tagName: 'colgroup',
                    parent: this.#dom.copyTable,
                })

                this.#instanceData[0].forEach(() => {
                    helper.createElement({ tagName: 'col', parent: this.#dom.copyColgroup })
                })
            }

            this.#dom.table!.prepend(this.#dom.header)
            this.#dom.copyTable && this.#dom.copyTable.prepend(this.#dom.copyHeader)

            this.#dom.table!.classList.remove('bomtable-no-header')
        }

        this.#instanceHeader.forEach((value, colNum) => {
            this.#dataMap[`${colNum}::-1`] = this.#createHeaderCell(value)
            this.#dataMap[`${colNum}::-2`] = this.#createHeaderCell(value, true)
            renders && renders(this, this.#dataMap[`${colNum}::-2`], colNum, -2, value, {})
        })

        if (!this.#instanceHeader.length) {
            this.removeHeader()
            this.#dom.table!.classList.add('bomtable-no-header')
        }

        return this
    }

    /**
     * Render helpers html elements
     * @return {BomTable}
     */
    #renderHelpers(): TBomTable {
        if (!this.#dom.buffer) {
            this.#dom.buffer = helper.createElement({
                tagName: 'textarea',
                selector: 'bomtable-buffer',
                parent: this.#dom.wrapper,
            }) as HTMLTextAreaElement
            this.#dom.buffer.addEventListener('paste', this._onBufferPaste.bind(this))
            this.#dom.buffer.addEventListener('keydown', this._onBufferKeyDown.bind(this))
        }
        if (this.#config.colsResize) {
            this.#dom.colResizer = helper.createElement({
                tagName: 'span',
                selector: 'bomtable-col-resizer',
                parent: this.#dom.wrapper,
            })
            this.#dom.colResizerLine = helper.createElement({
                tagName: 'span',
                selector: 'bomtable-col-resizer-line',
                parent: this.#dom.wrapper,
            })
        }
        return this
    }

    /**
     * Create header cell
     */
    #createHeaderCell(value: TCellValue = '', copy = false, onlyCreate = false): TBomTableTd {
        const parent = (!copy ? this.#dom.header!.firstElementChild : this.#dom.copyHeader!.firstElementChild) as HTMLElement
        const hasHeaderMenu = this.#config.headerMenu
        const th = helper.createElement({
            tagName: 'th',
            selector: 'bomtable-nw',
            parent: onlyCreate ? null : parent,
        })

        const thCont = helper.createElement({
            tagName: 'div',
            selector: 'bomtable-header-container',
            parent: th,
        })

        const wrap = helper.createElement({
            tagName: 'div',
            selector: 'bomtable-header-cell-wrap',
            parent: thCont,
        })

        if (hasHeaderMenu) {
            helper.createElement({
                tagName: 'button',
                selector: 'bomtable-header-cell-btn',
                parent: thCont,
            })
        }
        wrap.innerHTML = String(value)

        return th as TBomTableTd
    }

    /**
     * Remove table header
     */
    removeHeader(): TBomTable {
        (['header', 'copyHeader'] as const).forEach(key => {
            const el = this.#dom[key]
            if (!el) {
                return
            }
            helper.removeElement(el)
            this.#dom[key] = undefined
        })
        this.#instanceData[0].forEach((_, colNum) => {
            delete this.#dataMap[`${colNum}::-1`]
            delete this.#dataMap[`${colNum}::-2`]
        })
        return this
    }

    /**
     * Create context menu
     */
    createContextMenu(e: MouseEvent): TBomTable {
        let w = window
        let wrapPos = this.#getWrapTopLeftPosition()
        this.#createMenu(e, 'contextMenu')

        if (this.#config.contextMenu) {
            let left = e.pageX - wrapPos.left - w.pageXOffset
            let top = e.pageY - wrapPos.top - w.pageYOffset
            const menuWidth = this.#dom.contextMenu!.offsetWidth
            const menuHeight = this.#dom.contextMenu!.offsetHeight
            const diffHeight = this.#container!.offsetHeight - top

            if (menuWidth > this.#container!.offsetWidth - left && left > menuWidth) {
                left = left - menuWidth
            }
            if (!this.#isTouch && menuHeight > diffHeight && top > menuHeight) {
                top = top - menuHeight
            }
            this.#dom.contextMenu!.style.display = 'block'!
            this.#dom.contextMenu!.style.left = `${left}px`
            this.#dom.contextMenu!.style.top = `${top}px`

            if (this.#isTouch && menuHeight > diffHeight) {
                this.#dom.contextMenu!.style.height = `${diffHeight - 5}px`
                this.#dom.contextMenu!.style.minHeight = '40px'
                this.#dom.contextMenu!.style.overflow = 'scroll'
            }
        }

        return this
    }

    /**
     * Close menu
     */
    closeContextMenu(e: MouseEvent | KeyboardEvent): TBomTable {
        return this.#closeMenu(e, 'contextMenu')
    }

    /**
     * Create header menu
     */
    createHeaderMenu(e: MouseEvent): TBomTable {
        const el = e.target as HTMLElement
        const wrapPos = this.#getWrapTopLeftPosition()
        const btnRect = el.getBoundingClientRect()

        this.#createMenu(e, 'headerMenu')

        ;(el.parentNode as HTMLElement | null)?.classList.add('active')

        if (this.#config.headerMenu) {
            const menuWidth = this.#dom.headerMenu!.offsetWidth
            let left = btnRect.left - wrapPos.left
            if (menuWidth > this.#container!.offsetWidth - left && left > menuWidth) {
                left = left - menuWidth + el.offsetWidth
            }
            this.#dom.headerMenu!.style.left = `${left}px`
            this.#dom.headerMenu!.style.top = `${btnRect.bottom - wrapPos.top}px`
        }

        return this
    }

    /**
     * Close header menu
     */
    closeHeaderMenu(e: MouseEvent): TBomTable {
        [...document.querySelectorAll('.bomtable-header-container.active')].forEach(el => {
            el.classList.remove('active')
        })

        return this.#closeMenu(e, 'headerMenu')
    }

    /**
     * Create context or header menu
     */
    #createMenu(e: MouseEvent, menuName: TMenuName): TBomTable {
        if (this.destroyed) {
            return this
        }

        const history = this.#History
        const isContext = menuName === 'contextMenu'

        if (this.#config[menuName]) {
            !this.#isTouch && e.preventDefault()

            const data = { list: Object.assign({}, this.#config[menuName].items) }
            const selectedColsCount = this.getSelectedCols().length
            const selectedRowsCount = this.getSelectedRows().length
            const hookName = `before${helper.firstCharToUp(menuName)}Render` as 'beforeHeaderMenuRender' | 'beforeContextMenuRender'

            if (this.#config.hooks?.[hookName]) {
                this.#config.hooks[hookName](this, data.list)
            }
            const isHrReg = /^hr+\d*$/
            let className = ''
            let html = ''
            Object.keys(data.list).forEach(key => {
                if (isHrReg.test(key)) {
                    html += `<li class='bomtable-hr'></li>`
                } else {
                    className = helper.camelCaseToKebabCase(key)
                    if (
                        isContext
                        && ((key === 'unionCols' && selectedColsCount < 2)
                            || (key === 'unionRows' && selectedRowsCount < 2))
                    ) {
                        className += ' disabled'
                    }
                    if (history && ((key === 'undo' && !history.hasUndo()) || (key === 'redo' && !history.hasRedo()))) {
                        className += ' disabled'
                    }
                    html += `<li data-action='${key}' class='${className}'>${this.#config[menuName]!.items[key]}</li>`
                }
            })

            if (!this.#dom[menuName]) {
                this.#dom[menuName] = helper.createElement({
                    tagName: 'ul',
                    selector: `bomtable-${helper.camelCaseToKebabCase(menuName)}`,
                    parent: this.#dom.wrapper,
                })
            }

            this.#dom[menuName].innerHTML = html
        }

        return this
    }

    /**
     * Close context or header menu
     */
    #closeMenu(e: MouseEvent | KeyboardEvent, menuName: TMenuName): TBomTable {
        const el = e && e.target as HTMLElement | null
        if (!el || !this.#dom[menuName]) {
            return this
        }

        if (
            el && (!('button' in e) || e.button === 0)
            && this.#dom[menuName].children
            && [...this.#dom[menuName].children].includes(el)
        ) {
            const action = el.dataset.action

            if (action) {
                if (this.#config[menuName]?.callback) {
                    this.#config[menuName].callback(action, this, e, this.#lastSelected || {
                        colNum: null,
                        rowNum: null,
                    })
                } else if (action in this) {
                    const _action: keyof this = action as any
                    const method = this[_action]
                    if (typeof method === 'function') {
                        method.call(this)
                    }
                } else {
                    throw new Error(`Undefined action ${action}`)
                }
            }
        }

        helper.removeElement(this.#dom[menuName])
        this.#dom[menuName] = undefined

        return this
    }

    /**
     * **** events ****
     */

    /**
     * Touch start listener
     * @param {TouchEvent} e
     */
    _ontouchstart(e: TouchEvent) {
        const touches = e.touches
        const isOneFinger = touches.length === 1
        const _e = Object.assign(e, {
            pageX: isOneFinger ? touches[0].pageX : undefined,
            pageY: isOneFinger ? touches[0].pageY : undefined,
        })
        if (isOneFinger) {
            this.#touchStartPoint = { x: _e.pageX, y: _e.pageY }
        }
        this.#countTouch = touches.length
        if (this.#checkContainer(e)) {
            return this._onmousedown(e)
        }
        return true
    }

    /**
     * Mouse down listener
     * @param {MouseEvent|TouchEvent} e
     */
    _onmousedown(e: MouseEvent | TouchEvent) {
        if (!this || this.destroyed) {
            return false
        }

        let el = e.target as HTMLElement
        this.#hideColResizer()

        if (el!.classList.contains('bomtable-context-btn')) {
            this.createContextMenu(e as MouseEvent)
            return false
        }

        const input = this.#dom.input
        if (this.#isTouch && !input) {
            if (this.#tapped === el) {
                this._onContainerdblclick(e)
                clearTimeout(this.#tapTimeout)
                this.#tapped = null
                return false
            }
            this.#tapped = el
            this.#tapTimeout = setTimeout(() => {
                this.#tapped = null
            }, 500)
        }

        if (el === input?.el) {
            return false
        }

        this.#removeInput(true)

        if (this.#checkClickOnContextMenu(e)) {
            return false
        }

        this.closeContextMenu(e as MouseEvent)

        if (!helper.parents(el).some(p => p === this.#dom.table || p === this.#dom.copyTable)) {
            if (this.#dom.square && this.#dom.square === el) {
                this.#mouseBtnPressed = true
                this.#squarePressed = true
                return false
            }

            if (this.#dom.colResizer === el) {
                this.#mouseBtnPressed = true
                this.#colResizerPressed = true
                this.#colResizerPressedIndex = +(el.dataset.colNum as string)
                this.#dom.colResizer.classList.add('pressed')
            }

            this.clearActiveArea().#removeSquares().#removePressed()

            return true
        }

        this.#mouseBtnPressed = true

        this.#removeSquares()

        helper.parents(el).some(p => {
            if (p.tagName !== 'TH') {
                return false
            }
            el = p
            return true
        })

        if (!helper.isTableCell(el)) {
            return false
        }

        // left click on select area
        if ('button' in e && this.#selected.some(key => this.#dataMap[key] === el)) {
            return false
        }

        el && this.#setActiveCell(e, el as TBomTableTd)

        return false
    }

    /**
     * Touch end listener
     */
    _ontouchend(e: MouseEvent) {
        this._onmouseup(e)
    }

    /**
     * Mouse up listener
     */
    _onmouseup(e: MouseEvent | TouchEvent) {
        if (!this || this.destroyed) {
            return
        }

        const el = e.target as HTMLElement
        const clickOnContextMenu = this.#checkClickOnContextMenu(e)

        if (this.#isTouch) {
            this.#countTouch = (e as TouchEvent).touches.length

            if (this.#touchStartPoint.x && (e as TouchEvent).changedTouches.length) {
                const { pageX, pageY } = (e as TouchEvent).changedTouches[0]
                const { x, y } = this.#touchStartPoint

                // swipe on context menu
                if ((Math.abs(pageX - x!) > 5 || Math.abs(pageY - y!) > 5) && clickOnContextMenu) {
                    this.#touchStartPoint = {}
                    return
                }
            }
            this.#touchStartPoint = {}
        }

        if (clickOnContextMenu) {
            this.closeContextMenu(e as MouseEvent).clearActiveArea().#removeSquares().#removePressed()
            return
        }

        if (el.classList.contains('bomtable-context-btn')) {
            this.createContextMenu(e as MouseEvent)
        }

        this.#mouseBtnPressed = false
        this.#squarePressed = false
        this.#colResizerPressed = false

        if (
            this.#colResizerPressedIndex == null
            && (!('button' in e) || e.button === 0 || this.#isTouch)
            && el.classList.contains('bomtable-header-cell-btn')
            && !(el.parentNode as HTMLElement).classList.contains('active')
        ) {
            this.closeHeaderMenu(e as MouseEvent)
            this.createHeaderMenu(e as MouseEvent)
        } else {
            this.closeHeaderMenu(e as MouseEvent)
        }

        this.#setColSize().#removeCopyArea()

        if (this.#checkContainer(e) && !this.#dom.input) {
            this.#focusBuffer(e)
        }
    }

    /**
     * Touch move listener
     */
    _ontouchmove(e: TouchEvent): boolean {
        if (!this || this.destroyed) {
            return false
        }

        if (!this.#mouseBtnPressed || this.#countTouch > 1) {
            return true
        }
        e.preventDefault()

        let el: HTMLElement | null = null
        const touch = e.targetTouches[0]
        const windowYScroll = window.scrollY
        const X = touch.pageX
        const Y = touch.pageY

        // find hover element
        Object.keys(this.#dataMap).some(key => {
            let i = this.#dataMap[key]
            let rect = i.getBoundingClientRect()
            let isHover
                = rect.left < X
                    && windowYScroll + rect.top < Y
                    && rect.left + rect.width > X
                    && windowYScroll + rect.top + rect.height > Y

            if (!isHover) {
                return false
            }
            el = i
            return true
        })

        if (this.#colResizerPressedIndex != null) {
            this.#setColResizerPosition(this.#colResizerPressedIndex, X + 2.5)
            helper.clearSelected()
            return false
        }

        if (!el || this.#lastHover === el || !helper.isTableCell(el)) {
            return false
        }

        this.#lastHover = el

        if (!this.#squarePressed) {
            el && this.#setActiveCell(e, el)
        } else if ((el as HTMLElement).tagName === 'TD') {
            this.#squareAreaListener(e, el)
        }
        return false
    }

    /**
     * Mouse over listener
     */
    _onContainermouseover(e: MouseEvent): void {
        if (!this || this.destroyed) {
            return
        }

        const el = e.target as TBomTableTd

        if (!this.#mouseBtnPressed || !helper.isTableCell(el) || this.#squarePressed || this.#colResizerPressed) {
            return
        }

        this.#setActiveCell(e, el)
    }

    /**
     * Mouse move listener
     */
    _onContainermousemove(e: MouseEvent) {
        if (!this || this.destroyed) {
            return
        }

        const el = e.target as TBomTableTd

        if (this.#colResizerPressedIndex != null) {
            this.#setColResizerPosition(this.#colResizerPressedIndex, e.clientX)
            helper.clearSelected()
        }

        if (this.#lastHover === el) {
            return
        }

        const isFirstEl = this.#dom.header
            ? el.tagName === 'TH'
            : el.tagName === 'TD' && this.#dataMap[`${el.cellIndex}::0`] === el

        if (this.#colResizerPressedIndex == null && this.#config.colsResize && isFirstEl) {
            this.#setColResizerPosition(el.cellIndex)
        }

        this.#lastHover = el

        if (!this.#mouseBtnPressed) {
            return
        }

        if (this.#squarePressed && el.tagName === 'TD') {
            this.#squareAreaListener(e)
        }
    }

    /**
     * On mouse double click listener
     */
    _onContainerdblclick(e: MouseEvent | TouchEvent) {
        if (!this || this.destroyed) {
            return true
        }

        const el = e.target as TBomTableTd

        if (el.tagName !== 'TD' || !this.#checkContainer(e)) {
            return true
        }

        this.#setActiveCell(e, el)

        this.#createInput()
    }

    /**
     * On buffer keydown listener
     */
    _onBufferKeyDown(e: KeyboardEvent) {
        if (!this || this.destroyed || !this.#instanceData[0]) {
            return
        }

        let colNum = this.#lastSelected ? this.#lastSelected.colNum : undefined
        let rowNum = this.#lastSelected ? this.#lastSelected.rowNum : undefined
        let moveSelect = false // признак движения выделения клавишами
        let keyMustIgnore = helper._keysIgnore(e.key)

        if (colNum === undefined || rowNum === undefined) {
            return
        }

        const totalCols = this.#instanceData[0].length - 1
        const totalRows = this.#instanceData.length - 1
        const map = { start: { colNum, rowNum }, end: { colNum, rowNum } }

        if (this.#selected.length > 1 && this.#mouseDownElement && e.key.substring(0, 5) === 'Arrow') {
            rowNum = map.start.rowNum = map.end.rowNum = this.#mouseDownElement.rowNum
            colNum = map.start.colNum = map.end.colNum = this.#mouseDownElement.colNum
        }

        switch (e.key) {
            case 'ArrowLeft':
                if (colNum > 0) {
                    moveSelect = true
                    map.start.colNum = map.end.colNum = colNum - 1
                }
                if (!colNum) {
                    moveSelect = true
                    if (!rowNum) {
                        rowNum = totalRows + 1
                    }
                    map.start.rowNum = map.end.rowNum = rowNum - 1
                    map.start.colNum = map.end.colNum = totalCols
                }
                break
            case 'ArrowRight':
                if (totalCols === colNum) {
                    moveSelect = true
                    if (rowNum === totalRows) {
                        rowNum = -1
                    }
                    map.start.colNum = map.end.colNum = 0
                    map.start.rowNum = map.end.rowNum = rowNum + 1
                }
                if (totalCols > colNum) {
                    moveSelect = true
                    map.start.colNum = map.end.colNum = colNum + 1
                }
                break
            case 'ArrowUp':
                if (rowNum > 0) {
                    moveSelect = true
                    map.start.rowNum = map.end.rowNum = rowNum - 1
                }
                if (!rowNum) {
                    moveSelect = true
                    if (!colNum) {
                        colNum = totalCols + 1
                    }
                    map.start.rowNum = map.end.rowNum = totalRows
                    map.start.colNum = map.end.colNum = colNum - 1
                }
                break
            case 'ArrowDown':
                if (totalRows > rowNum) {
                    moveSelect = true
                    map.start.rowNum = map.end.rowNum = rowNum + 1
                }
                if (rowNum === totalRows) {
                    moveSelect = true
                    if (colNum === totalCols) {
                        colNum = -1
                    }
                    map.start.rowNum = map.end.rowNum = 0
                    map.start.colNum = map.end.colNum = colNum + 1
                }
                break
            case 'Enter':
                if (this.#checkContainer(e)) {
                    this.#createInput()
                }
                e.preventDefault()
                break
            case 'Delete': {
                const values: { col: number, row: number }[] = []
                this.getSelectedMap().forEach(i => {
                    const [col, row] = helper._splitKey(i)
                    if (this.#dataMap[i]) {
                        values.push({ col, row })
                    }
                })
                if (values.length) {
                    values.forEach(i => this.#setDataCell({ ...i, val: '' }))
                    this.#History && this.#History.push('setDataCell')
                }
                keyMustIgnore = true
                this.#rerenderActiveArea()
            }
                break
        }

        // ctrl + a
        if (e.ctrlKey && e.key.toLowerCase() === 'a') {
            moveSelect = false
            map.start.rowNum = 0
            map.start.colNum = 0

            map.end.rowNum = this.getData().length - 1
            map.end.colNum = this.getData()[0].length - 1
            this.#setActiveArea(map)
        }

        // ctrl + x
        if (e.ctrlKey && e.key.toLowerCase() === 'x') {
            const values: { col: number, row: number }[] = []
            this.#selected.forEach(i => {
                if (!this.#dataMap[i]) {
                    return
                }
                const [col, row] = helper._splitKey(i)
                values.push({ col, row })
            })
            if (values.length) {
                values.forEach(i => this.#setDataCell({ ...i, val: '' }))
                this.#History && this.#History.push('setDataCell')
            }
            this.#rerenderActiveArea()
        }

        // need move active area
        if (moveSelect && map.start.rowNum !== undefined && map.end.rowNum !== undefined) {
            e.preventDefault()
            this.#removeInput()
            if (map.start.rowNum < 1) {
                map.start.rowNum = 0
            }
            if (map.end.rowNum < 1) {
                map.end.rowNum = 0
            }
            this.#removePressed()
            this.#setActiveArea(map)
        } else if (!e.ctrlKey && !e.shiftKey && !keyMustIgnore && !this.#mouseBtnPressed) {
            this.#createInput(false)
        }
    }

    /**
     * Context menu listener
     */
    _oncontextmenu(e: MouseEvent) {
        const _container = this.#container
        if (!this || this.destroyed || this.#dom.input || !_container) {
            return
        }
        const el = e.target as typeof _container

        if (!helper.parents<typeof el>(el).includes(_container) || !this.#checkContainer(e)) {
            return
        }

        this.createContextMenu(e)
    }

    /**
     * On key down listener
     */
    _onkeydown(e: KeyboardEvent) {
        if (!this || this.destroyed) {
            return
        }

        if (e.key === 'Escape') {
            if (this.#mouseBtnPressed && this.#dom.copyAreaLeft) {
                this.#removeCopyArea(false)
                e.stopPropagation()
                e.preventDefault()
                return
            }
            if (this.#colResizerPressedIndex != null) {
                this.#setColResizerPosition(0, -1)
                this.#colResizerPressedIndex = 0
                e.stopPropagation()
                e.preventDefault()
                return
            }
        }

        if (!this.#instanceData[0]) {
            return
        }

        const el = this.#dom.input?.el
        const keyCode = e.code

        if (e.ctrlKey && !el && keyCode !== 'KeyA' && this.#checkContainer(e)) {
            this.#focusBuffer(e).#setValueToBuffer()
        }

        if (e.ctrlKey && keyCode === 'KeyZ') {
            this.undo()
            return
        }

        if (e.ctrlKey && keyCode === 'KeyY') {
            this.redo()
            return
        }

        el && e.stopPropagation()

        this.closeContextMenu(e)
    }

    /**
     * On paste listener
     */
    _onBufferPaste(e: ClipboardEvent) {
        if (!this || this.destroyed) {
            return
        }

        e.stopPropagation()
        e.preventDefault()

        const selectedArea: string[][] = []
        const selectedCols = this.getSelectedCols()
        const selectedRows = this.getSelectedRows()
        const oneSelected = selectedCols.length === selectedRows.length && selectedRows.length === 1

        selectedRows.forEach(r => {
            const row: string[] = []
            selectedCols.forEach(c => row.push(`${c}::${r}`))
            selectedArea.push(row)
        })

        const _pasteData = e.clipboardData!.getData('Text').split('\n').map(i => i.split('\n'))

        if (selectedArea.length > _pasteData.length) {
            let index = 0
            let lengthPasteData = _pasteData.length
            while (selectedArea.length > _pasteData.length) {
                _pasteData.push(_pasteData[index++])
                if (index === lengthPasteData) {
                    index = 0
                }
            }
        } else if (oneSelected && _pasteData.length > selectedArea.length) {
            let lastRowIndex = selectedRows[selectedRows.length - 1]
            while (_pasteData.length > selectedArea.length) {
                const nextRow: string[] = []
                lastRowIndex++
                selectedCols.forEach(c => {
                    nextRow.push(`${c}::${lastRowIndex}`)
                })
                selectedArea.push(nextRow)
            }
        }

        if (!selectedArea[0] || !_pasteData[0]) {
            return
        }

        if (selectedArea[0].length > _pasteData[0].length) {
            _pasteData.forEach(row => {
                let index = 0
                let lengthPasteData = _pasteData[0].length
                while (selectedArea[0].length > row.length) {
                    row.push(row[index++])
                    if (index === lengthPasteData) {
                        index = 0
                    }
                }
            })
        } else if (oneSelected && _pasteData[0].length > selectedArea[0].length) {
            let lastColIndex = selectedCols[selectedCols.length - 1]
            while (_pasteData[0].length > selectedArea[0].length) {
                lastColIndex++
                selectedArea.forEach(r => {
                    r.push(`${lastColIndex}::${r[0].split('::')[1]}`)
                })
            }
        }

        const map: {
            start: { colNum: number, rowNum: number }
            end: { colNum: number, rowNum: number }
        } = { start: { colNum: -1, rowNum: -1 }, end: { colNum: -1, rowNum: -1 } }
        const values: { col: number, row: number, val: string }[] = []

        selectedArea.forEach((row, rowIndex) => {
            row.forEach((key, colIndex) => {
                const [colNum, rowNum] = helper._splitKey(key)

                if (map.start.colNum == null || map.start.colNum > colNum) {
                    map.start.colNum = colNum
                }
                if (map.start.rowNum == null || map.start.rowNum > rowNum) {
                    map.start.rowNum = rowNum
                }

                if (map.end.colNum == null || colNum > map.end.colNum) {
                    map.end.colNum = colNum
                }
                if (map.end.rowNum == null || rowNum > map.end.rowNum) {
                    map.end.rowNum = rowNum
                }

                if (this.#dataMap[key]) {
                    values.push({ col: colNum, row: rowNum, val: _pasteData[rowIndex][colIndex] })
                }
            })
        })

        if (values.length) {
            values.forEach(i => this.#setDataCell(i))
            this.#History && this.#History.push('setDataCell')
        }

        this.#rerenderActiveArea()
        this.#calcColsWidth().#setActiveArea(map)
    }

    /**
     * On container scroll listener
     */
    _onContainerscroll() {
        if (!this || this.destroyed || !this.#container) {
            return
        }
        clearTimeout(this.#containerScrollTimeout)
        this.#containerScrollTimeout = setTimeout(() => {
            const elHelper = this.#dom.elHelper
            if (!elHelper || !this.#lastSelected?.el) {
                return
            }
            const td = this.#lastSelected.el
            const tdRect = td.getBoundingClientRect()
            const wrapPos = this.#getWrapTopLeftPosition()
            const left = tdRect.left - wrapPos.left - 1

            elHelper.style.left = `${left}px`
            elHelper.style.maxWidth = `${this.#container!.offsetWidth - left - 25 + this.#container!.scrollLeft}px`
            elHelper.style.minHeight = `${td.offsetHeight}px`
        }, 50)
    }

    /**
     * On input change value listener
     */
    _onInput() {
        if (!this || this.destroyed || !this.#dom.elHelper || !this.#dom.input) {
            return
        }
        this.#updateInputSize()
    }

    /**
     * On key down input listener
     */
    _onInputKeyDown(e: KeyboardEvent) {
        if (!this || this.destroyed || !e.target) {
            return
        }

        const el = e.target as HTMLInputElement
        const val = el.value

        // cursor move inside input
        if (
            el.selectionEnd === null
            || ((e.key === 'ArrowLeft' && el.selectionStart !== 0)
                || (e.key === 'ArrowRight' && el.selectionEnd < val.length))
        ) {
            return
        }

        let needMove = false
        let focusToBuffer = false
        let cancel = false
        let saveValue = true
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                focusToBuffer = true
                needMove = true
                break
            case 'Escape':
                cancel = true
                saveValue = false
                break
        }

        if (e.ctrlKey && e.key === 'Enter') {
            cancel = true
            saveValue = true
        }

        if (focusToBuffer || cancel) {
            this.#focusBuffer(e)
        }

        if (cancel) {
            this.#mouseBtnPressed = false
            this.#squarePressed = false
            this.#colResizerPressed = false
            this.#removeInput(saveValue)
            e.stopPropagation()
            e.preventDefault()
        }

        if (needMove) {
            this._onBufferKeyDown(e)
        }
    }

    /**
     * Set focus buffer
     */
    #focusBuffer(e: MouseEvent | KeyboardEvent | TouchEvent): TBomTable {
        if (this.destroyed) {
            return this
        }

        if (!this.#checkContainer(e) || this.#isTouch) {
            return this
        }

        const el = e.target as HTMLElement
        const wrapPos = this.#getWrapTopLeftPosition()
        const rect = el.getBoundingClientRect()
        this.#dom.buffer!.style.top = `${rect.top - wrapPos.top}px`
        this.#dom.buffer!.style.left = `${rect.left - wrapPos.left}px`
        this.#dom.buffer!.focus()
        return this
    }

    /**
     * Check click on context menu
     */
    #checkClickOnContextMenu(e: MouseEvent | TouchEvent): boolean {
        const el = e.target as HTMLElement
        const menuClass = 'bomtable-context-menu'
        return (
            (el.classList && el.classList.contains && el.classList.contains(menuClass))
            || helper.parents(el).some(p => p.classList && p.classList.contains && p.classList.contains(menuClass))
        )
    }

    /**
     * Set value from data to copy/paste buffer
     */
    #setValueToBuffer(): TBomTable {
        if (this.destroyed) {
            return this
        }

        const str: string[] = []
        this.getSelectedData().forEach(row => str.push(row.join('\t')))
        this.#dom.buffer!.value = str.join('\n')
        this.#dom.buffer!.select()

        return this
    }

    /**
     * Set active cell
     */
    #setActiveCell(e: MouseEvent | TouchEvent, el: TBomTableTd) {
        let keyType: 'shiftKey' | 'ctrlKey' | 'none' = 'none'

        if (e.shiftKey) {
            keyType = 'shiftKey'
        } else if (e.ctrlKey) {
            keyType = 'ctrlKey'
        }

        this.#removePressed()

        if (e.type !== 'dblclick') {
            helper.clearSelected()
        }

        const res = this.#colNumRowNumByEl(el)
        if (!res) {
            return
        }

        const [colNum, rowNum] = res

        if (['mousedown', 'touchstart'].includes(e.type)) {
            this.#mouseDownElement = { el, colNum, rowNum }
        }

        if (this.#mouseDownElement) {
            this.#mouseDownElement.el && this.#mouseDownElement.el.classList.add('pressed')

            this.#setActiveArea(
                {
                    start: {
                        colNum: this.#mouseDownElement.colNum,
                        rowNum: this.#mouseDownElement.rowNum > -1 ? this.#mouseDownElement.rowNum : 0,
                    },
                    end: {
                        colNum,
                        rowNum: this.#mouseDownElement.rowNum > -1 ? rowNum : this.#instanceData.length - 1,
                    },
                },
                keyType,
            )

            if (
                this.#mouseDownElement.rowNum < 0
                && this.#isTouch
                && this.#config.colsResize
                && this.#colResizerPressedIndex == null
                && this.#mouseDownElement.colNum === colNum
            ) {
                this.#setColResizerPosition((el as TBomTableTd).cellIndex)
                this.#dom.colResizer!.classList.add('active')
            } else {
                this.#hideColResizer()
            }
        }

        this.#setLastSelected(el, +colNum, +rowNum)
    }

    /**
     * Save last selected cell
     */
    #setLastSelected(el: HTMLElement, colNum: number, rowNum: number) {
        if (this.#lastSelected && this.#lastSelected.el === el) {
            return
        }

        this.#lastSelected = { el, colNum, rowNum }
    }

    /**
     * Save and mark active area
     */
    #setActiveArea(map: {
        start: { colNum: number, rowNum: number }
        end: { colNum: number, rowNum: number }
    }, keyType: 'shiftKey' | 'ctrlKey' | 'none' = 'none'): TBomTable {
        if (this.destroyed) {
            return this
        }
        let { colNum: startCol, rowNum: startRow } = map.start
        let { colNum: endCol, rowNum: endRow } = map.end
        let rows: number[] = []
        const cols: number[] = []

        // if press shift key
        if (keyType === 'shiftKey' && this.#lastSelected) {
            if (this.#lastSelected.rowNum! > startRow) {
                endRow = this.#lastSelected.rowNum as number
            } else {
                startRow = this.#lastSelected.rowNum as number
            }
            if (this.#lastSelected.colNum! > startCol) {
                endCol = this.#lastSelected.colNum as number
            } else {
                startCol = this.#lastSelected.colNum as number
            }
        }

        // clear selected
        ;['shiftKey', 'none'].includes(keyType) && this.#clearActiveArea()

        // revert if right to left
        if (startCol > endCol) {
            startCol = map.end.colNum
            endCol = map.start.colNum
        }

        // revert if down to up
        if (startRow > endRow) {
            startRow = map.end.rowNum
            endRow = map.start.rowNum
        }

        if (startRow < 0) {
            startRow = 0
        }
        // array rows
        for (let i = startRow; endRow >= i; i++) {
            rows.push(i)
        }

        // select only headers
        if (rows.length === 1 && rows[0] === -1) {
            // total rows length
            endRow = this.#instanceData.length - 1
            // select all rows
            rows = []
            for (let i = 0; endRow >= i; i++) {
                rows.push(i)
            }
        }

        // array cols
        for (let i = startCol; endCol >= i; i++) {
            cols.push(i)
        }

        cols.forEach(col => {
            rows.forEach(row => {
                if (row === -1) {
                    return
                }
                let key = `${col}::${row}`
                let el = this.#dataMap[key]
                if (this.#selected.includes(key)) {
                    this.#selected = this.#selected.filter(s => s !== key)
                } else {
                    this.#selected.push(key)
                }
                el && el.classList.toggle('area')
            })
        })

        if (this.#selected.length === 1) {
            let chunks = helper._splitKey(this.#selected[0])
            this.#setLastSelected(this.#dataMap[this.#selected[0]], chunks[0], chunks[1])
        }

        this.#lastSelectArea = {
            start: { col: startCol, row: startRow },
            end: { col: endCol, row: endRow },
        }

        this.#createSquares()

        let position = this.#ariaPosition({ startCol, startRow, endCol, endRow })
        if (position) {
            this.#addSquareArea(position, 'activeArea')
        }

        this.#instanceHeader.length && this.getSelectedCols().forEach(colIndex => {
            let th = this.#dataMap[`${colIndex}::-2`]
            th && th.classList.add('highlight')
        })

        this.#scrollToActive()
        return this
    }

    /**
     * Position of area
     */
    #ariaPosition({ startCol, startRow, endCol, endRow }: {
        startCol: number
        startRow: number
        endCol: number
        endRow: number
    }, borderWidth = 1) {
        const borderHalf = Math.ceil(borderWidth / 2)
        const firstTd = this.#dataMap[`${startCol}::${startRow}`]
        if (!firstTd) {
            return false
        }

        const lastTd = this.#dataMap[`${endCol}::${endRow}`]
        if (!lastTd) {
            return false
        }

        const firstRect = firstTd.getBoundingClientRect()
        const lastRect = lastTd.getBoundingClientRect()

        return {
            left: firstRect.left - (!startCol ? 0 : borderHalf),
            top: firstRect.top - (!startRow ? 0 : borderHalf),
            bottom: lastRect.bottom - borderHalf,
            right: lastRect.right - borderHalf,
        }
    }

    /**
     * Rerender active area square and draggable square
     */
    #rerenderActiveArea(): TBomTable {
        if (this.destroyed) {
            return this
        }
        if (!this.#lastSelectArea || !Object.keys(this.#lastSelectArea).length) {
            return this
        }
        const area = this.#lastSelectArea
        const { col: startCol, row: startRow } = area.start
        const { col: endCol, row: endRow } = area.end
        const position = this.#ariaPosition({ startCol, startRow, endCol, endRow })
        if (!position) {
            return this
        }
        return this.#addSquareArea(position, 'activeArea').#createSquares()
    }

    /**
     * scroll to active area
     */
    #scrollToActive(): TBomTable {
        let selected = this.#selected
        if (selected.length > 1 || !this.#dataMap[selected[0]] || !this.#container) {
            return this
        }
        const container = this.#container
        const elRect = this.#dataMap[selected[0]].getBoundingClientRect()
        const wrapPos = this.#getWrapTopLeftPosition()
        const top = elRect.top - wrapPos.top - 1
        const left = elRect.left - wrapPos.left
        const right = left + elRect.width
        const bottom = top + elRect.height + 1
        const headerHeight = this.#dom.copyHeader ? this.#dom.copyHeader.clientHeight : 0
        const topPoint = container.scrollTop
        const bottomPoint = topPoint + container.clientHeight
        const leftPoint = container.scrollLeft
        const rightPoint = leftPoint + container.clientWidth
        let scrollX = leftPoint
        let scrollY = topPoint

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

        if (scrollX < 1 && scrollY < 1) {
            return this
        }
        container.scrollTo(scrollX, scrollY)

        return this
    }

    /**
     * Clear active area
     */
    clearActiveArea(): TBomTable {
        return this.#removeActiveArea().#clearActiveArea()
    }

    /**
     * Clear active area without borderlines
     */
    #clearActiveArea(): TBomTable {
        if (!this.#lastSelected && !this.#selected.length) {
            return this
        }

        this.#instanceData.length
        && this.getSelectedMap().forEach(key => {
            let el = this.#dataMap[key]
            el && el.classList.remove('area')
        })

        this.#lastSelectArea = null
        this.#selected = []
        this.#lastSelected = null
        this.getHeader().forEach((_, index) => {
            let th = this.#dataMap[`${index}::-2`]
            th && th.classList.remove('highlight')
        })

        return this.#removeSquares()
    }

    /**
     * Remove borderlines active area
     */
    #removeActiveArea() {
        this.#removeSquareArea('activeArea')
        this.#dom.activeAreaLeft = this.#dom.activeAreaRight = this.#dom.activeAreaTop = this.#dom.activeAreaBottom = undefined
        return this
    }

    /**
     * Get container top and left position
     */
    #getWrapTopLeftPosition(): { top: number, left: number } {
        const cont = this.#container!
        const rect = cont.getBoundingClientRect()
        const css = window.getComputedStyle(cont)
        const getNumber = helper.getNumberFromString

        return {
            top: rect.top - cont.scrollTop + getNumber(css.paddingTop) + getNumber(css.borderTopWidth),
            left: rect.left - cont.scrollLeft + getNumber(css.paddingLeft) + getNumber(css.borderLeftWidth),
        }
    }

    /**
     * Create draggable square
     */
    #createSquares() {
        const { col: endCol, row: endRow } = this.#lastSelectArea!.end

        if (!this.#instanceData || !this.#instanceData.length) {
            return this
        }

        const downRightTd = this.#dataMap[`${endCol}::${endRow}`]
        const topCorrector = this.#instanceData.length === endRow + 1 ? 3 : 0
        const rightCorrector = this.#instanceData[0].length === endCol + 1 ? 3 : 0
        const wrapPos = this.#getWrapTopLeftPosition()

        if (!downRightTd || downRightTd.tagName !== 'TD') {
            return this
        }

        if (!this.#dom.square) {
            this.#dom.square = helper.createElement({
                tagName: 'div',
                selector: 'bomtable-square',
                parent: this.#dom.wrapper,
            })
        }

        const rectDownRight = downRightTd.getBoundingClientRect()

        if (this.#isTouch && this.#config.contextMenu) {
            const startRow = this.#lastSelectArea!.start.row
            const topRightTd = this.#dataMap[`${endCol}::${startRow}`]

            if (topRightTd) {
                let rectTopRight = topRightTd.getBoundingClientRect()
                if (!this.#dom.contextBtn) {
                    this.#dom.contextBtn = helper.createElement({
                        tagName: 'div',
                        selector: 'bomtable-context-btn',
                        parent: this.#dom.wrapper,
                    })
                }

                let topCorrector = !startRow && !this.#dom.header ? 9 : 0
                this.#dom.contextBtn.style.top = `${rectTopRight.top - wrapPos.top + topCorrector}px`
                this.#dom.contextBtn.style.left = `${rectDownRight.right - rightCorrector - wrapPos.left}px`
            }
        }

        this.#dom.square.style.top = `${rectDownRight.bottom - topCorrector - wrapPos.top}px`
        this.#dom.square.style.left = `${rectDownRight.right - rightCorrector - wrapPos.left}px`

        return this
    }

    /**
     * Remove square
     */
    #removeSquares(): TBomTable {
        this.#dom.square && helper.removeElement(this.#dom.square)
        this.#dom.square = undefined

        this.#dom.contextBtn && helper.removeElement(this.#dom.contextBtn)
        this.#dom.contextBtn = undefined

        return this
    }

    /**
     * Remove pressed class from last active element
     */
    #removePressed() {
        this.#mouseDownElement && this.#mouseDownElement.el.classList.remove('pressed')
    }

    /**
     * Listener move square
     */
    #squareAreaListener(e: MouseEvent | TouchEvent, el: HTMLElement | null = null) {
        const _el = el || e.target as HTMLElement

        const w = window
        const bottomRightSelectTr = this.#dataMap[`${this.#lastSelectArea!.end.col}::${this.#lastSelectArea!.end.row}`]
        const rectBRSTr = bottomRightSelectTr.getBoundingClientRect()
        const elMap: { col: number, row: number } = { col: -1, row: -1 }

        const touch = this.#isTouch && 'targetTouches' in e && e.targetTouches[0]
        const X = touch ? touch.pageX : (e as MouseEvent).pageX
        const Y = touch ? touch.pageY : (e as MouseEvent).pageY

        let startCol,
            endCol,
            startRow,
            endRow
        this.#direction = { x: '', y: '' }

        Object.keys(this.#dataMap).some(key => {
            let td = this.#dataMap[key]
            let splitKey

            if (td !== _el) {
                return false
            }

            splitKey = helper._splitKey(key)
            elMap.col = splitKey[0]
            elMap.row = splitKey[1]

            return true
        })

        endCol = elMap.col
        endRow = elMap.row

        if (rectBRSTr.right + w.pageXOffset > X) {
            // left

            startCol = this.#lastSelectArea!.end.col
            endCol = this.#lastSelectArea!.end.col

            this.#direction.x = 'left'

            if (startCol > elMap.col) {
                startCol = elMap.col
            }
        } else {
            // right
            this.#direction.x = 'right'
            startCol = this.#lastSelectArea!.start.col
        }

        if (startCol > this.#lastSelectArea!.start.col) {
            startCol = this.#lastSelectArea!.start.col
        }

        // up
        if (rectBRSTr.top + w.pageYOffset > Y) {
            startRow = this.#lastSelectArea!.start.row
            endRow = this.#lastSelectArea!.end.row

            this.#direction.y = 'up'

            if (startRow > elMap.row) {
                startRow = elMap.row
            }
        } else {
            // down
            this.#direction.y = 'down'
            startRow = this.#lastSelectArea!.start.row
        }

        helper.clearSelected()

        let position = this.#ariaPosition({ startCol, startRow, endCol, endRow }, 3)
        if (position) {
            this.#addSquareArea(position, 'copyArea').#setSquareDragCell({ startCol, endCol, startRow, endRow })
        }
    }

    /**
     * Create square area contains lines, and append it to this.#dom.wrapper
     */
    #addSquareArea(position: {
        left: number
        top: number
        bottom: number
        right: number
    }, name: 'activeArea' | 'copyArea'): BomTable {
        let wrapPos = this.#getWrapTopLeftPosition()
        let startClassName = `bomtable-${helper.camelCaseToKebabCase(name)}`

        if (!this.#dom[`${name}Left`]) {
            ;(['Left', 'Top', 'Right', 'Bottom'] as const).forEach(key => {
                this.#dom[`${name}${key}`] = helper.createElement({
                    tagName: 'div',
                    selector: `${startClassName}-${key.toLowerCase()}`,
                    parent: this.#dom.wrapper,
                })
            })
        }

        const top = position.top - wrapPos.top
        const left = position.left - wrapPos.left
        const right = position.right - wrapPos.left
        const bottom = position.bottom - wrapPos.top
        const height = position.bottom - position.top
        const width = position.right - position.left

        this.#dom[`${name}Left`]!.style.top = `${top}px`
        this.#dom[`${name}Left`]!.style.left = `${left}px`
        this.#dom[`${name}Left`]!.style.height = `${height}px`

        this.#dom[`${name}Right`]!.style.top = `${top}px`
        this.#dom[`${name}Right`]!.style.left = `${right}px`
        this.#dom[`${name}Right`]!.style.height = `${height}px`

        this.#dom[`${name}Top`]!.style.top = `${top}px`
        this.#dom[`${name}Top`]!.style.left = `${left}px`
        this.#dom[`${name}Top`]!.style.width = `${width}px`

        this.#dom[`${name}Bottom`]!.style.top = `${bottom}px`
        this.#dom[`${name}Bottom`]!.style.left = `${left}px`
        this.#dom[`${name}Bottom`]!.style.width = `${width}px`

        return this
    }

    /**
     * Remove square area
     */
    #removeSquareArea(name: 'activeArea' | 'copyArea') {
        if (!this.#dom[`${name}Left`]) {
            return
        }
        ;(['Left', 'Top', 'Right', 'Bottom'] as const).forEach(key => {
            helper.removeElement(this.#dom[`${name}${key}`])
            this.#dom[`${name}${key}`] = undefined
        })
    }

    /**
     * Max col width
     */
    #getColWidth(colNum: number): number {
        const hasHeader = this.#dom.header
        const headerColW = hasHeader && this.#dataMap[`${colNum}::-1`] ? this.#dataMap[`${colNum}::-1`].offsetWidth : 0
        const fistTdW = this.#dataMap[`${colNum}::0`].offsetWidth
        const colElWidth
            = hasHeader && this.#dom.copyColgroup!.children[colNum]
                ? helper.getNumberFromString((this.#dom.copyColgroup!.children[colNum] as HTMLTableColElement).width)
                : 0
        const w = this.#manualColSize[colNum] || Math.max(...[headerColW, fistTdW, colElWidth, this.#minColWidth])
        return Math.ceil(w)
    }

    /**
     * Draw square
     */
    #setSquareDragCell(map: { startCol: number, endCol: number, startRow: number, endRow: number }): TBomTable {
        this.#squareDragArea = []
        for (let col = map.startCol; map.endCol >= col; col++) {
            for (let row = map.startRow; map.endRow >= row; row++) {
                this.#squareDragArea.push(`${col}::${row}`)
            }
        }
        return this
    }

    /**
     * Set width for bomtabie container
     */
    #setContainerWidth(): TBomTable {
        this.#dom.wrapper!.style.width = '10000000px'
        this.#dom.table!.style.width = 'auto'
        let width = 0
        this.#dom.header && this.#dom.header!.classList.remove('bomtable-hidden')
        this.#instanceData[0].forEach((_, colNum) => (width += this.#getColWidth(colNum)))
        this.#dom.wrapper!.style.width = `${Math.ceil(width)}px`
        this.#dom.header && this.#dom.header!.classList.add('bomtable-hidden')
        this.#dom.table!.style.width = ''
        return this
    }

    /**
     * Set width for column
     */
    #setColSize(): TBomTable {
        if (this.#colResizerPressedIndex == null) {
            return this
        }

        const hasHeader = this.#dom.header

        if (hasHeader) {
            this.#dom.header!.classList.remove('bomtable-hidden')
        }

        const colNum = this.#colResizerPressedIndex
        const el = hasHeader ? this.#dataMap[`${colNum}::-2`] : this.#dataMap[`${colNum}::0`]
        const leftEl = el.getBoundingClientRect().left
        const wrapPosLeft = this.#getWrapTopLeftPosition().left
        const colEl = [...this.#dom.colgroup!.children][colNum] as HTMLElement
        let width = this.#dom.colResizerLine!.getBoundingClientRect().x - wrapPosLeft - (leftEl - wrapPosLeft)
        if (width < this.#minColWidth) {
            width = this.#minColWidth
        }
        colEl.style.width = `${width}px`

        this.#manualColSize[colNum] = width
        this.#colResizerPressedIndex = null

        this.#hideColResizer()

        if (hasHeader) {
            this.#dom.header!.classList.add('bomtable-hidden')
        }

        return this.#setColResizerPosition(0, -1).#setContainerWidth().#calcColsWidth()
    }

    /**
     * Hide colResize element
     */
    #hideColResizer() {
        if (!this.#dom.colResizer) {
            return
        }
        this.#dom.colResizer.classList.remove('active')
        this.#dom.colResizer.classList.remove('pressed')
    }

    /**
     * Move ColResizer
     */
    #setColResizerPosition(colNum: number, position: number | null = null): TBomTable {
        const el = this.#dom.header ? this.#dataMap[`${colNum}::-2`] : this.#dataMap[`${colNum}::0`]

        if (!el || (this.#mouseBtnPressed && !this.#colResizerPressed)) {
            return this
        }

        const wrapPos = this.#getWrapTopLeftPosition()
        const elRect = el.getBoundingClientRect()
        const containerRightPosition = this.#container!.getBoundingClientRect().right

        let elRight = position || elRect.right
        if (elRight < wrapPos.left) {
            elRight = wrapPos.left
        }
        if (elRight > containerRightPosition) {
            elRight = containerRightPosition
        }
        let calcPosition = elRight - wrapPos.left

        if (calcPosition <= 0) {
            calcPosition = -10
        }
        this.#dom.colResizer!.style.left = `${calcPosition - 5}px`
        this.#dom.colResizer!.style.top = `${elRect.top - wrapPos.top}px`
        this.#dom.colResizer!.style.height = `${el.offsetHeight}px`
        this.#dom.colResizerLine!.style.left = `${calcPosition - 2}px`

        !position && (this.#dom.colResizer!.dataset.colNum = String(colNum))

        return this
    }

    /**
     * Remove drag area
     */
    #removeCopyArea(saveValue: boolean = true): TBomTable {
        if (!this.#dom.copyAreaLeft) {
            return this
        }

        this.#removeSquareArea('copyArea')

        if (!saveValue || !this.#squareDragArea.length) {
            this.#squareDragArea = []
            this.#direction = { x: '', y: '' }

            this.#setContainerWidth().#calcColsWidth()
            return this
        }

        const map: {
            start: { colNum?: number, rowNum?: number }
            end: { colNum?: number, rowNum?: number }
        } = { start: {}, end: {} }

        const squareAreaMap: Record<string, string[]> = {}
        const copyDataKeys: string[][] = []
        const { start: ls, end: le } = this.#lastSelectArea!

        for (let rowNum = ls.row; rowNum <= le.row; rowNum++) {
            let rowData = []
            for (let colNum = ls.col; colNum <= le.col; colNum++) {
                rowData.push(`${colNum}::${rowNum}`)
            }
            copyDataKeys.push(rowData)
        }

        this.#squareDragArea.forEach(key => {
            let rowNum = +key.split('::')[1]
            if (rowNum < 0) {
                return
            }
            if (!squareAreaMap[rowNum]) {
                squareAreaMap[rowNum] = []
            }
            squareAreaMap[rowNum].push(key)
        })

        const _squareAreaMap = Object.values(squareAreaMap)

        if (copyDataKeys.length !== _squareAreaMap.length || _squareAreaMap[0].length !== copyDataKeys[0].length) {
            if (_squareAreaMap.length > copyDataKeys.length) {
                let index = 0
                const lengthData = copyDataKeys.length
                while (_squareAreaMap.length > copyDataKeys.length) {
                    if (this.#direction.y === 'down') {
                        copyDataKeys.push(copyDataKeys[index++])
                        if (index === lengthData) {
                            index = 0
                        }
                    } else {
                        copyDataKeys.unshift(copyDataKeys[copyDataKeys.length - ++index])
                    }
                }
            }

            if (_squareAreaMap[0].length > copyDataKeys[0].length) {
                copyDataKeys.forEach(row => {
                    let index = 0
                    const lengthData = copyDataKeys.length
                    while (_squareAreaMap[0].length > row.length) {
                        if (this.#direction.x === 'right') {
                            row.push(row[index++])
                            if (index === lengthData) {
                                index = 0
                            }
                        } else {
                            row.unshift(row[row.length - ++index])
                        }
                    }
                })
            }

            const values: { col: number, row: number, val: TCellValue }[] = []
            _squareAreaMap.forEach((row, rowIndex) => {
                row.forEach((key, colIndex) => {
                    const copyKey = copyDataKeys[rowIndex][colIndex]
                    const [colNum, rowNum] = helper._splitKey(key)

                    if (map.start.colNum == null || map.start.colNum > colNum) {
                        map.start.colNum = colNum
                    }
                    if (map.start.rowNum == null || map.start.rowNum > rowNum) {
                        map.start.rowNum = rowNum
                    }

                    if (map.end.colNum == null || colNum > map.end.colNum) {
                        map.end.colNum = colNum
                    }
                    if (map.end.rowNum == null || rowNum > map.end.rowNum) {
                        map.end.rowNum = rowNum
                    }

                    if (copyKey === key) {
                        return
                    }

                    const [colCopyNum, rowCopyNum] = helper._splitKey(copyKey)
                    values.push({ col: colNum, row: rowNum, val: this.getDataCell(colCopyNum, rowCopyNum) })
                })
            })
            if (values.length) {
                values.forEach(i => this.#setDataCell({ ...i, val: '' }))
                this.#History && this.#History.push('setDataCell')
            }
            this.#rerenderActiveArea()
        }

        this.#squareDragArea = []
        this.#direction = { x: '', y: '' }

        this.#setContainerWidth().#calcColsWidth()

        Object.keys(map.start).length && Object.keys(map.end).length && this.#setActiveArea(map as any)

        return this
    }

    /**
     * Create table textarea
     */
    #createInput(setCellValue: boolean = true): TBomTable {
        if (!this.#lastSelected || this.#lastSelected.el!.tagName !== 'TD') {
            return this
        }

        const td = this.#lastSelected.el as TBomTableTd
        const tdRect = td.getBoundingClientRect()
        const wrapPos = this.#getWrapTopLeftPosition()
        const left = tdRect.left - wrapPos.left
        const textarea = helper.createElement<HTMLTextAreaElement>({
            tagName: 'textarea',
            selector: 'bomtable-input',
            parent: this.#dom.wrapper,
            css: {
                left: `${left > 0 ? left - 1 : left}px`,
                top: `${tdRect.top - wrapPos.top - 1}px`,
            } as HTMLElement['style'],
        })

        textarea.addEventListener('input', this._onInput.bind(this))
        textarea.addEventListener('keydown', this._onInputKeyDown.bind(this))

        if (setCellValue) {
            textarea.value = td.innerHTML
        }

        if (this.#dom.input) {
            this.#removeInput(false)
        }

        this.#dom.input = {
            el: textarea,
            colNum: this.#lastSelected.colNum!,
            rowNum: this.#lastSelected.rowNum!,
        }
        this.#createElHelper({ td, left })

        this.#updateInputSize().#removeSquares()

        textarea.focus()

        return this
    }

    /**
     * Update input size
     */
    #updateInputSize(): TBomTable {
        if (!this.#dom.elHelper || !this.#dom.input) {
            return this
        }

        const elHelper = this.#dom.elHelper
        const textarea = this.#dom.input.el
        const tdRect = this.#lastSelected!.el!.getBoundingClientRect()
        const alignment = this.#lastSelected!.colNum ? 1 : 0
        elHelper.textContent = `${textarea.value}.`

        const elHelperStyles = window.getComputedStyle(elHelper)
        const countLines = Math.ceil(elHelper.scrollWidth / elHelper.offsetWidth)
        const height = Math.max(helper.getNumberFromString(elHelperStyles.lineHeight) * countLines, tdRect.height + 1)
        const minHeight = `${height}px`
        const minWidth = `${tdRect.width + alignment}px`

        elHelper.style.minHeight = minHeight
        elHelper.style.minWidth = minWidth

        textarea.style.width = `${elHelper.offsetWidth}px`
        textarea.style.minWidth = minWidth
        textarea.style.minHeight = minHeight
        textarea.style.height = `${elHelper.offsetHeight}px`
        return this
    }

    /**
     * Remove table textarea
     * @param {boolean} saveValue - save value before remove textarea
     */
    #removeInput(saveValue: boolean = true): TBomTable {
        if (!this.#dom.input) {
            return this
        }

        const val = this.#dom.input.el.value
        const { colNum, rowNum } = this.#dom.input

        this.#dom.input.el.removeEventListener('input', this._onInput)

        helper.removeElement(this.#dom.input.el)
        helper.removeElement(this.#dom.elHelper)

        this.#dom.input = undefined

        if (!saveValue) {
            return this
        }
        this.setDataCell({ col: colNum, row: rowNum, val: !Number.isNaN(+val) ? Number(val) : val })

        return this
    }

    /**
     * Create helper element
     */
    #createElHelper({ td, left }: { td: TBomTableTd, left: number }) {
        const textareaStyle = window.getComputedStyle(this.#dom.input!.el)
        this.#dom.elHelper = helper.createElement({
            tagName: 'span',
            parent: this.#dom.wrapper,
            css: {
                top: 0,
                left: `${left}px`,
                position: 'absolute',

                zIndex: -1,
                opacity: 0,
                display: 'block',

                maxWidth: `${this.#container!.offsetWidth - left - 25 + this.#container!.scrollLeft}px`,
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
            } as any as HTMLElement['style'],
        })
    }

    /**
     * Get node colNum and rowNum
     */
    #colNumRowNumByEl(el: TBomTableTd): [number, number] | null {
        let index = Object.keys(this.#dataMap).find(key => this.#dataMap[key] === el)
        return index ? helper._splitKey(index) : null
    }

    /**
     * Check witch container is now active
     */
    #checkContainer(e: MouseEvent | KeyboardEvent | TouchEvent): boolean {
        const _container = this.#container
        const el = e.target as typeof _container
        if (!el || !el.parentNode) {
            return true
        }
        const container = helper.parents(el).find(e => e === _container)
        if (!container) {
            return false
        }
        return this.#key === container.instanceKey
    }

    /**
     * Clear data of this
     */
    clear(): TBomTable {
        if (!this.#dom) {
            this.#dom = {}
        }

        this.#handlers = {}
        this.#removeInput(false)
        this.#removeCopyArea(false)

        this.#instanceData = []
        this.#instanceHeader = []
        this.#dataMap = {}
        this.#cellMeta = {}

        this.#manualColSize = {}
        this.#countTouch = 0
        this.#touchStartPoint = {}

        this.#colResizerPressed = false
        this.#squarePressed = false

        this.#tapped = null

        this.#lastSelectArea = null
        const tmp = this.#dom
        Object.keys(this.#dom).forEach(nodeName => {
            const _nodeName = nodeName as keyof typeof tmp

            if (!this.#dom[_nodeName]) {
                return
            }
            if (typeof this.#dom[_nodeName] === 'object') {
                Object.keys(this.#dom[_nodeName]).forEach(key => {
                    const _key = key as keyof typeof tmp['rows']
                    helper.removeElement(this.#dom[_nodeName]![_key])
                    this.#dom[_nodeName]![_key] = undefined as never
                })
            }
            helper.removeElement(this.#dom[_nodeName] as HTMLElement)
            delete this.#dom[_nodeName]
        })

        this.#selected = []
        this.#lastSelected = null

        this.#mouseDownElement = null
        this.#lastHover = null
        return this
    }

    /**
     * 'destroy' and clear this
     */
    destroy() {
        Object.keys(this.#handlers).forEach(event => {
            const domEvent = event.substring(3)
            document.removeEventListener(domEvent, this.#handlers[event as TDocumentHandlersName] as any)
        })

        clearTimeout(this.#containerScrollTimeout)
        clearTimeout(this.#tapTimeout)

        this.destroyed = true
        this.clear()

        this.#key = ''
        this.#config = {} as any

        this.#History && this.#History.destroy()

        this.#History = null
    }
}
