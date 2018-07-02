# bomtable
web table like simple excel

Simple javascript application for working with data, use familiar interface excel

<br/>

<div align="center">
<img src="http://lebonnet.ru/bomtable/bt_lg.png" alt="bomtable logo" />
</div>

<br/>

1. [How to use](#how-to-use)
2. [Examples](#examples)
3. [Options](#options)
4. [Methods](#methods)
5. [Browser support](#browser-support)
6. [License](#license)

<br/>


### How to use

```javascript
let instance = new BomTable({
    tableClass: 'ex-tbl',
    container: '.example',
    data: [[0, 7, 8, 9], [1, 20, 30], [2, 5], [3], [4, 56, 55, 22, 15, 18], [5, 7, 1], [6]],
    header: ['0', '1', '2', '3', '4', '5', '6']
});
```

<br/>

### Examples
- [See a live demo](http://lebonnet.ru/bomtable/index.html)

<br/>

### Options
```javascript
let opts = {
    data: [], // data for table body (default empty array)
    header: '', // table header (default empty string)
    tableClass: '', // css class for table (default empty)
    container: null, // node or selector for mount table (default null)
    rowsClass: '', // css class for table rows (default empty string)
    colsClass: '', // css class for table cols (default empty string)
    
    // context menu 
    contextMain: {
        items: {}, // items - object with list item
        callback: (action, instance, event) => {} // default null
    } 
};
```

<br/>

### Methods
```
getData() - get table data ({Array})

getHeader() - get table header ({Array})

getSelected() - get selected map ({Array})

getSelectedData() - get data of selected map ({Array})

getDataCell({col - number}, {row - number}) - get cell value

getSelectedRows() - get index of selected rows ({Array})

getSelectedCols() - get index of selected cols ({Array})

getSelectedRows() - get index of selected rows

getSelectedCols() - get index of selected cols

```
<br/>

```
setData({Array}) - set new data

setHeader({Array}) - set new data header

setDataCell({col - number}, {row - number}, {*}) - set new data in cell

setDataCell({col - number}, {row - number}, {*}) - set new data in cell
```
<br/>

```
addRow() - create new row

addCol() - create new col

removeRows({Array}) - remove get rows or selected rows

removeCols({Array}) - remove get cols or selected cols

removeHeader() - remove table header
```
<br/>

```
clear() - clear data of instance

destroy() - destroy instance
```


<br/>

### Browser support
Chrome 67+, Mozilla Firefox 59+, IE9+

<br/>

### license
Standard MIT license