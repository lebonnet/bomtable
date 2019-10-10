<div align="center">
<img src="http://lebonnet.ru/bomtable/bt.png" alt="bomtable logo" />
</div>

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
- [See a live demo | посмотреть пример](http://lebonnet.ru/bomtable/index.html)

renders example
```javascript
let instance = new BomTable({
    tableClass: 'ex-tbl',
    container: '.example',
    data: [[0, 7, 8, 9], [1, 20, 30], [2, 5], [3], [4, 56, 55, 22, 15, 18], [5, 7, 1], [6]],
    header: ['0', '1', '2', '3', '4', '5', '6'],

    renders: (inst, td, colNum, rowNum, val) => {
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
    header: '', // table header (default empty string) | массив с заголовками для таблицы
    touchSupport: true, // support touch in browsers | поддержка касаний в браузерах
    tableClass: '', // css class for table (default empty) | css класс для таблицы
    container: null, // node or selector for mount table (default null) | HTML элемент или селектор для монтирования таблицы
    rowsClass: '', // css class for table rows (default empty string) | css класс для строк
    colsClass: '', // css class for table cols (default empty string) | css класс для столбцов
    
    renders: null, // function for render cells | функция для рендера ячеек

    // context menu | контекстное меню
    contextMenu: {
        items: {}, // items - object with list item | объект со списком элементов меню
        callback: (action, instance, event) => {} // default null | функция обратного вызова, срабатывает по клику по пункту меню
    },

    // if headers sets, use like context menu | если заданы заголовки, готовить так же как контекстное меню
    // default empty
    headerMenu: {
        items: {}, // items - object with list item | объект со списком элементов меню
        callback: (action, instance, event) => {} // default null | функция обратного вызова, срабатывает по клику по пункту меню
    },

};
```

<br/>

### Methods
### методы
```
getData() - get table data | получить данные из таблицы ({Array})

getHeader() - get table header | получить заголовки таблицы ({Array})

getSelected() - get selected map | получить карту выделенных элементов ({Array})

getSelectedData() - get data of selected area | получить данные с выделенной области ({Array})

getDataCell({col - number}, {row - number}) - get cell value | получить значение ячейки

getSelectedRows() - get index of selected rows | получить индексы выделенных строк ({Array})

getSelectedCols() - get index of selected cols | получить индексы выделенных столбцов ({Array})

```
<br/>

```
setData({Array}) - set new data | установить новые данные

setHeader({Array}) - set new data header | установить новые заголовки

setDataCell({col - number}, {row - number}, {*}) - set new value in cell | установить новое значение ячейки

```
<br/>

```
addRow() - create new row | создать новую строку

addCol() - create new col | создать новый столбец

removeRows({Array}) - remove get rows or selected rows | удалить строки по индексам передающихся входным параметром

removeCols({Array}) - remove get cols or selected cols | удалить столбцы по индексам передающихся входным параметром

unionCols({Array})  - union get cols or selected cols | объеденить столбцы по индексам

removeHeader() - remove table header | удалить заголовок таблицы
```
<br/>

```
clear() - clear data of instance | очистить instance

destroy() - destroy instance | разрушить instance
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