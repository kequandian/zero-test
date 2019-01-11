#!/usr/bin/env node
let dateUtil = require("./util/dateUtil");
let fs = require("fs");
let StringUtil = require("./util/StringUtil");
let genarator = require("./genarator");
let program = require('commander');
let db = require("./util/mysqlUtil");
let Table = require("cli-table2");

function list (val) {
    return val.split(',');
}

function collect(val, memo) {
    memo.push(val);
    return memo;
  }
program
    .version('0.0.1')
    .usage('[options] [value ...]')
    .description("# api-gen: 自动生成数据表必填字段数据\n# 通过mysql.config指定数据库")
    .option('-h, --help')
    .option('-t, --table <value>', "指定table")
    .option('-s, --sql <string>', '执行指定sql语句')
    .option('-e, --extra <item>', '指定除not null字段外需生成的的字段', list)
    .option('-a, --all', '所有字段都生成')
    .option('--list', "show tables")
    .option('-f, --file <value>', "使用指定格式参数生成字段参数(指定json文件路径)")
    .option('--filter <value>')
    .option('--mysql <file>', "指定mysql配置文件位置,env-test使用")
    .on('--help', function() {
        console.log("Example:"),
        console.log('  -e name,note    #input list: [\'name\',\'note\']')
    });

program.parse(process.argv);
if(!program.mysql) {
    console.log("api-gen index.js: --mysql 不能为空");
    return ;
}
if(program.list) {
    db.query(program.mysql, 'show tables', function(result, err){
        let tableList = JSON.stringify(result).replace(new RegExp(',?{"Tables_in_gentest":"', 'gm'), '').replace(new RegExp('"}', 'gm'), ',');
        console.log(tableList);
        tableList = tableList.replace('[', '').replace(']', '');
        tableList = tableList.substring(0, tableList.length - 1).split(',');
        let table = new Table({head:["table_name"]});
        for(let index in tableList) {
            table.push([tableList[index]]);
        }
        console.log(table.toString());
    });
} else if(program.sql) {
    db.query(program.mysql, program.sql, function(result, err){
        console.log(result);
    });
} else if(program.table) {
    let extra;
    if(program.extra) {
        extra = program.extra;
    } else {
        extra = [];
    }
    let sql = `DESCRIBE ${program.table}`;
    db.query(program.mysql, sql, function(result, err){
        console.log(JSON.stringify(genarator.genarateValuesByTable(result, program.filter, program.all, extra)));
    });
    
} else if(program.file) {
    let result = JSON.parse(fs.readFileSync(program.file, "UTF-8"));
    console.log(JSON.stringify(genarator.genarateValuesBySwagger(result, program.filter)));
} else {
    program.outputHelp(read);
}

function read(txt) {
    return txt; 
}


