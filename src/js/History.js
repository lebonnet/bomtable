export default class History {
    constructor(opts = {}) {
        /**
         * Config
         * @type {Object}
         */
        this.config = Object.assign({ bt: null }, opts)

        this.carriage = 0
        this.state = {}
    }

    push(event, params) {
        this.carriage++
        this.state[this.carriage] = { event, params }
    }
    undo() {}
    redo() {}
    clear() {}
    destroy() {
        this.clear()
    }
}
