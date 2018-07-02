'use strict';

import "babel-polyfill";
import Core from "./core";
import "../scss/bomtable.scss"

function BomTable(opts) {
    const instance = new Core(opts);

    instance._ini();

    return instance;
}

export default window.BomTable = BomTable;