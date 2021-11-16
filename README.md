<div align="center">
<img src="https://lebonnet.github.io/logo.png" width="200" alt="bomtable logo" />
</div>

[demo](https://lebonnet.github.io/)

<br/>

web table like simple excel<br/>
web таблица - упрощенная версия excel
<br/>
Simple javascript library for working with data, use familiar interface excel<br/>
Простая javascript библиотека для работы с табличными данным, используя привычный интерфейс excel

<br/>

1. [How to use | как использовать](#how-to-use)
2. [Examples | примеры](#examples)
3. [Options | параметры](#options)
4. [Methods | методы](#methods)
5. [Browser support | поддержка браузерами](#browser-support)
6. [License | лицензия](#license)

<br/>

### How to use
##### как использовать

Yarn install

```text
yarn add bomtable
```

```javascript
let instance = new BomTable({
    tableClass: 'ex-tbl',
    container: '.example',
    data: [[0, 7, 8, 9], [1, 20, 30], [2, 5], [3], [4, 56, 55, 22, 15, 18], [5, 7, 1], [6]],
    header: ['0', '1', '2', '3', '4', '5', '6'],
});
```

<br/>

### Examples
- [ demo | посмотреть пример](https://lebonnet.github.io/)

renders example
```javascript
let instance = new BomTable({
    tableClass: 'ex-tbl',
    container: '.example',
    data: [[0, 7, 8, 9], [1, 20, 30], [2, 5], [3], [4, 56, 55, 22, 15, 18], [5, 7, 1], [6]],
    header: ['0', '1', '2', '3', '4', '5', '6'],

    renders: (inst, td, colNum, rowNum, val, cellMeta) => {
        if (colNum === 2) td.style.color = 'tomato'
        if (val === 1) td.style.color = 'green'
    },

});
```

<br/>

### Options
### параметры
```javascript
let opts = {
    data: [], // data for table body (default empty array) | массив с данными
    header: null, // table header (default null) | массив с заголовками для таблицы
    stickyHeader: true, // sticky table header (default true) | прилипающий заголовок таблицы 
    touchSupport: true, // support touch in browsers (default true) | поддержка касаний в браузерах
    tableClass: '', // css class for table (default empty) | css класс для таблицы
    container: null, // node or selector for mount table (default null) | HTML элемент или селектор для монтирования таблицы
    rowsClass: '', // css class for table rows (default empty string) | css класс для строк
    colsClass: '', // css class for table cols (default empty string) | css класс для столбцов
    useHistory: true, // use state history (default true) | использовать историю состояния
    colsResize: false, // resizable columns (default false) | колонки изменяемого размера

    renders: null, // function for render cells (default null) | функция для рендера ячеек

    // context menu | контекстное меню
    contextMenu: {
        items: {}, // items - object with list item (default {}) | объект со списком элементов меню
        callback: (action, instance, event) => {} // on contextmenu callback function (default null) | функция обратного вызова, срабатывает по клику по пункту меню
    },

    // if headers sets, use this menu like context menu | если заданы заголовки, готовить так же как контекстное меню
    // default empty
    headerMenu: {
        items: {}, // items - object with list item (default {}) | объект со списком элементов меню
        callback: (action, instance, event) => {} // on header menu click function (default null) | функция обратного вызова, срабатывает по клику по пункту меню
    },

    // event hooks 
    hooks: {
        beforeContextMenuRender: (instance, list) => {
            // here you can change the menu list
            list.removeRows = 'remove row'; 
        },
        beforeHeaderMenuRender: (instance, list) => {
            // here you can change the menu list
            list.removeRows = 'remove row'; 
        }
    }
};
```

<br/>

### Methods
### методы
```
data - (getter) get table data | получить данные из таблицы ({Array})

header - (getter) get table header | получить заголовки таблицы ({Array})

selectedMap - (getter) get selected map | получить карту выделенных элементов ({Array})

selectedData - (getter) get data of selected area | получить данные с выделенной области ({Array})

dataCell(col {number}, row {number}) - (getter) get cell value | получить значение ячейки

selectedRows - (getter) get index of selected rows | получить индексы выделенных строк ({Array})

selectedCols - (getter) get index of selected cols | получить индексы выделенных столбцов ({Array})

dataRow - (getter) get row data by index | получить данные строки по индексу ({Array})
 
dataCol - (getter) get col data by index | получить данные столбца по индексу ({Array})

metaDataCell - (getter) get cell meta data by property name | получить мета данные ячейки по имени свойства ({Any})
```
<br/>

```
data = {Array} - (setter) set new data | установить новые данные

header = {Array} - (setter) set new data header | установить новые заголовки

dataCell = {col: {number}, {row: {number}, val: {*}) - (setter) set new value in cell | установить новое значение ячейки

dataRow - {row: {number(rowIndex)}, data: {Array}} (setter) - set new row values | установить новые значени для строки 
 
dataCol - {col: {number(colIndex)}, data: {Array}} (setter) - set new col values | установить новые значени для столбца

metaDataCell - {col: {number}, row: {number}, propName: {String} val: {Any}} - set any data for cell by property name | установить любые мета данные для ячейки по имени свойства
```
<br/>

```
addRow() - create new row | создать новую строку

addCol() - create new col | создать новый столбец

removeRows({Array}) - remove get rows or selected rows | удалить строки по индексам передающихся входным параметром

removeCols({Array}) - remove get cols or selected cols | удалить столбцы по индексам передающихся входным параметром

unionRows({Array})  - union get rows or selected rows | объеденить строки по индексам

unionCols({Array})  - union get cols or selected cols | объеденить столбцы по индексам

removeHeader() - remove table header | удалить заголовок таблицы
```
<br/>

```
render() - rerender instance data | перерендерить данные

clear() - clear data of instance | очистить instance

destroy() - destroy instance | разрушить instance
```
<br/>

### Hooks
### Хуки
```
beforeContextMenuRender (instance: {BomTable}, menuList: {Object})

beforeHeaderMenuRender (instance: {BomTable}, menuList: {Object})
```
<br/>

### Browser support
### поддержка браузерами
Chrome 67+, Mozilla Firefox 59+, IE9+,
Touch support
<br/>

### license
### лицензия
Standard MIT license
