import type { TBomTable, TCellValue } from './Bomtable.ts'
import { cloneArray } from './helper.ts'

type THistoryAction
    = 'setData'
        | 'unionCols'
        | 'unionRows'
        | 'removeCols'
        | 'setHeader'
        | 'setDataCell'
        | 'addRow'
        | 'addCol'
        | 'removeRows'

interface THistoryParms {
    data?: TCellValue[][]
    header?: TCellValue[]
}

export class History {
    private readonly bt: TBomTable | null = null
    private readonly action: (p: THistoryParms) => void

    historyLimit = 10
    carriage = 0
    state: {
        action: THistoryAction
        params: THistoryParms
        beforeUndo?: THistoryParms
    }[] = []

    constructor(bt: TBomTable, action: (p: THistoryParms) => void) {
        this.bt = bt
        this.action = action
        this.state.push({ action: 'setData', params: { header: [...bt.getHeader()], data: cloneArray(bt.getData()) } })
    }

    /**
     * push to history
     */
    push(action: THistoryAction) {
        this.state = this.state.slice(0, this.carriage + 1)

        const bt = this.bt!

        const params: THistoryParms = {}
        switch (action) {
            case 'setHeader':
                params.header = [...bt.getHeader()]
                break
            case 'setData':
            case 'unionCols':
            case 'removeCols':
            case 'addCol':
                params.header = [...bt.getHeader()]
                params.data = cloneArray(bt.getData())
                break
            case 'addRow':
            case 'unionRows':
            case 'removeRows':
            case 'setDataCell':
                params.data = cloneArray(bt.getData())
                break
        }
        this.state.push({ action, params })
        this.carriage++

        if (this.state.length > this.historyLimit) {
            this.state = this.state.slice(this.historyLimit * -1)
            this.carriage = this.state.length
        }
    }

    /**
     * has undo step
     */
    hasUndo(): boolean {
        return Boolean(this.state.length > 1 && this.carriage > 0)
    }

    /**
     * has redo step
     */
    hasRedo(): boolean {
        return Boolean(this.state.length > 1 && this.carriage !== this.state.length)
    }

    /**
     * undo
     */
    undo() {
        if (!this.state.length || !this.carriage) {
            return
        }
        this.carriage--

        const state = this.state[this.carriage]
        if (!state) {
            return
        }

        this.action(state.params)
    }

    /**
     * redo
     */
    redo() {
        if (!this.state.length || this.carriage === this.state.length - 1) {
            return
        }
        this.carriage++

        const state = this.state[this.carriage]

        if (!state) {
            return
        }

        this.action(state.params)
    }

    /**
     * clear
     */
    clear() {
        this.state = []
        this.carriage = 0
    }

    /**
     * destroy
     */
    destroy() {
        this.clear()
    }
}
