export class BomTable {
    constructor(opts = {}) {

        /**
         * Config
         * @type {Object}
         */
        this.config = Object.assign({
            fid: undefined,
        }, opts);

        return this;
    }
}
