import { cloneArray } from './helper'

export default class History {
    constructor(opts = {}) {
        /**
         * Config
         * @type {Object}
         */
        this.config = Object.assign({ bt: null }, opts)

        this.historyLimit = 10
        this.carriage = -1
        this.state = []
    }

    /**
     * push to history
     * @param action
     * @param params
     */
    push(action, params) {
        if (this.state.length && this.carriage !== this.state.length) {
            this.state.length = this.carriage > -1 ? this.carriage : 0
        }
        this.carriage = this.state.push({ action, params })

        if (this.state.length > this.historyLimit) {
            this.state = this.state.slice(this.historyLimit * -1)
            this.carriage = this.state.length
        }
    }

    /**
     * has undo step
     * @returns {boolean}
     */
    get hasUndo() {
        return Boolean(this.state.length && this.carriage > 0)
    }

    /**
     * has redo step
     * @returns {boolean}
     */
    get hasRedo() {
        return Boolean(this.state.length && this.carriage !== this.state.length)
    }

    /**
     * undo
     */
    undo() {
        if (!this.state.length) return

        this.carriage--
        if (this.carriage < 0) {
            this.carriage = -1
            return
        }

        let data = this.state[this.carriage]
        if (!data) return

        data.beforeUndo = this.doAction('undo', data.action, data.params)
    }

    /**
     * redo
     */
    redo() {
        if (!this.state.length) return

        this.carriage++

        if (this.carriage > this.state.length) {
            this.carriage = this.state.length
            return
        }
        let data = this.state[this.carriage - 1]

        if (!data || !data.beforeUndo) return

        let revertAction = ''
        switch (data.action) {
            case 'setData':
            case 'unionCols':
            case 'unionRows':
            case 'removeCols':
            case 'addCol':
            case 'removeRows':
                revertAction = 'setData'
                break
            case 'setHeader':
            case 'setDataCell':
                revertAction = data.action
                break
            case 'addRow':
                revertAction = 'removeRows'
                break
        }
        this.doAction('redo', revertAction, data.beforeUndo)
    }

    /**
     * @param event
     * @param action
     * @param params
     * @returns {{data: *}|{col: *, data: *, row: *}}
     */
    doAction(event, action, params) {
        let bt = this.config.bt,
            isUndo = event === 'undo',
            prevParams
        switch (action) {
            case 'setData':
            case 'unionCols':
            case 'unionRows':
            case 'removeCols':
                bt.config.data = params.data
                isUndo && (prevParams = { data: cloneArray(bt.data) })
                if (params.header && params.header.length) {
                    isUndo && (prevParams.header = [...bt.header])
                    bt.config.header = params.header
                }
                bt.clear()._render()._renderHelpers()
                break
            case 'setHeader':
                isUndo && (prevParams = { data: [...bt.header] })
                bt.config.header = params.data
                bt.removeHeader()._renderHeader().render()
                break
            case 'setDataCell':
                let prevValues = { data: [] }
                params.data.forEach(h => {
                    let { col, row, val } = h,
                        td = bt.dataMap[`${col}::${row}`],
                        valType = typeof val

                    if (isUndo) {
                        prevValues.data.push({ col, row, val: bt.instanceData[row][col] })
                    }

                    td.bomtableValType = valType
                    td.innerHTML = val
                    bt.instanceData[row][col] = val
                })
                if (prevValues.data.length) {
                    prevParams = prevValues
                }
                break
            case 'addRow':
                isUndo && (prevParams = { data: [[...bt.dataRow(params.row)]] })
                bt._removeRows([params.row])
                break
            case 'addCol':
                isUndo && (prevParams = { data: cloneArray(bt.data), header: [...bt.header] })
                bt._removeCols([params.col + 1])
                break
            case 'removeRows':
                isUndo && (prevParams = { data: cloneArray(bt.data) })
                params.data.sort((a, b) => a.row - b.row)
                params.data.forEach(i => bt._createRow({ index: i.row, rowData: i.data, render: true }))
                Object.keys(bt.dataMap).forEach(key => bt.dataMap[key].classList.remove('area'))
                bt._removeSquare()
                bt._reindex()
                break
        }

        let ls = bt.lastSelected
        if (ls && (ls.colNum > bt.dataRow(0).length - 1 || ls.rowNum > bt.dataCol(0).length - 1)) {
            bt.clearActiveArea()
        } else if (ls) {
            bt._rerenderActiveArea()
        }

        return prevParams
    }

    /**
     * clear
     */
    clear() {
        this.state = {}
        this.carriage = 0
    }

    /**
     * destroy
     */
    destroy() {
        this.clear()
    }
}
