let Table = require("cli-table2");

let table = new Table();
table.push(
    [{rowSpan:2,content:'greetings',vAlign:'center'},'hello'],
    [[{rowSpan:2,content:'greetings',vAlign:'innerTable'}]]
  );

  console.log(table.toString());