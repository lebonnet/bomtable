import type { TBomTable, TCellValue } from './Bomtable.ts'
import { cloneArray } from './helper'

type THistoryAction = 'setData'
    | 'unionCols'
    | 'unionRows'
    | 'removeCols'
    | 'setHeader'
    | 'setDataCell'
    | 'addRow'
    | 'addCol'
    | 'removeRows'

interface THistoryParms {
    data?: TCellValue[][] | TCellValue[] | { col: number, row: number, val: TCellValue }[]
    header?: TCellValue[]
    row?: number
    col?: number
}
export class History {
    private readonly bt: TBomTable | null = null

    historyLimit = 10
    carriage = -1
    state: {
        action: THistoryAction
        params: THistoryParms
        beforeUndo?: THistoryParms
    }[] = []

    constructor(bt: TBomTable) {
        this.bt = bt
    }

    /**
     * push to history
     */
    push(action: THistoryAction, params: THistoryParms) {
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
     */
    hasUndo(): boolean {
        return Boolean(this.state.length && this.carriage > 0)
    }

    /**
     * has redo step
     */
    hasRedo(): boolean {
        return Boolean(this.state.length && this.carriage !== this.state.length)
    }

    /**
     * undo
     */
    undo() {
        if (!this.state.length) {
            return
        }

        this.carriage--
        if (this.carriage < 0) {
            this.carriage = -1
            return
        }

        const data = this.state[this.carriage]
        if (!data) {
            return
        }

        data.beforeUndo = this._doAction('undo', data.action, data.params)
    }

    /**
     * redo
     */
    redo() {
        if (!this.state.length) {
            return
        }

        this.carriage++

        if (this.carriage > this.state.length) {
            this.carriage = this.state.length
            return
        }
        const data = this.state[this.carriage - 1]

        if (!data || !data.beforeUndo) {
            return
        }

        let revertAction: THistoryAction = 'setData'
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
        this._doAction('redo', revertAction, data.beforeUndo)
    }

    _doAction(event: 'undo' | 'redo', action: THistoryAction, params: THistoryParms) {
        const bt = this.bt!
        const isUndo = event === 'undo'
        let prevParams: THistoryParms = {} as any
        switch (action) {
            case 'setData':
            case 'unionCols':
            case 'unionRows':
            case 'removeCols':
            case 'removeRows':
                bt._config.data = params.data as TCellValue[][]
                isUndo && (prevParams = { data: cloneArray(bt.getData()) })
                if (params.header && params.header.length) {
                    isUndo && (prevParams!.header = [...bt.getHeader()])
                    bt._config.header = params.header
                }
                bt.clear()._render()._renderHelpers()
                break
            case 'setHeader':
                isUndo && (prevParams = { data: [...bt.getHeader()] })
                bt._config.header = params.data as TCellValue[]
                bt.removeHeader()._renderHeader().render()
                break
            case 'setDataCell': {
                const prevValues: { data: { col: number, row: number, val: TCellValue }[] } = { data: [] }
                params.data!.forEach(h => {
                    const { col, row, val } = h as { col: number, row: number, val: TCellValue }
                    const td = bt._dataMap[`${col}::${row}`]
                    const valType = typeof val

                    if (isUndo) {
                        prevValues.data.push({ col, row, val: bt.getDataCell(col, row) })
                    }

                    td.bomtableValType = valType
                    td.innerHTML = val == null ? '' : String(val)
                    bt.setDataCell({ col, row, val })
                })
                if (prevValues.data.length) {
                    prevParams = prevValues
                }
            }
                break
            case 'addRow':
                isUndo && (prevParams = { data: [[...bt.getDataRow(params.row!)]] })
                bt._removeRows([params.row!])
                break
            case 'addCol':
                isUndo && (prevParams = { data: cloneArray(bt.getData()), header: [...bt.getHeader()] })
                bt._removeCols([(params.data as number[])[0] + 1])
                break
        }

        const ls = bt._lastSelected
        if (ls && ((ls.colNum || 0) > bt.getDataRow(0).length - 1 || (ls.rowNum || 0) > bt.getDataCol(0).length - 1)) {
            bt.clearActiveArea()
        } else if (ls || bt._lastSelectArea) {
            bt._rerenderActiveArea()
        }

        return prevParams
    }

    /**
     * clear
     */
    clear() {
        this.state = []
        this.carriage = -1
    }

    /**
     * destroy
     */
    destroy() {
        this.clear()
    }
}
