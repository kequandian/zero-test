#!/usr/bin/env node
let Table = require("cli-table2");
let program = require('commander');
let fs = require('fs');
let convertToTable = require('./convertToTable');
let printLog = require('./printLog');
let convertToVTable = require("./convertToVTable");
let DataUtil = require("./util/DataUtil");
let shelljs = require("shelljs");

function list (val) {
    return val.split(',');
}
program
    .version('0.0.1')
    .description('# pretty-json: json转表格的cli脚本\n# 支持横向、列向两种表格形式')
    .usage('[options] [value ...]')
    .option('-h, --help')
    .option('-v, --value [value]')
    .option('-f, --file <value>')
    .option('-t, --title <value>')
    .option('-c, --convert')
    .option('--pdf <value>', '导出pdf （pending')
    .option('-e, --exclude <items>',"排除指定字段", list)
    .option('-i, --include <items>', "指定只生成部分字段", list)
    .option('-p, --parent', '仅生成主表, 默认生成所有表格')
    .option('-s, --sub', '仅生成子表')
    .option('--log', '生成日志')
    .option('--body <file>', "日志中记录POST|PUT api请求body");
program.on('--help', function() {
    console.log("Example:"),
    console.log('  -i 1,2,3    #input list: [\'1\',\'2\',\'3\']'),
    console.log("  -v {\\\"key\\\":\\\"value\\\"}"),
    console.log("  -p ./test/test.json")
});


//解析commandline arguments
program.parse(process.argv)

let flag = 0;
let header = "data";
// 处理
if(program.title != undefined) {
    flag ++;
    console.log(program.title);
   // printLog(program.title, program.log);
   printLog(`### **${program.title}**`, program.log)
}
if(program.body != undefined) {
    let body = fs.readFileSync(program.body, "UTF-8");
    printLog("```\nBody: " + body + "\n```", program.log);
}
let data;
if(program.value != undefined) {
    data = JSON.parse(program.value);
} else if (program.file != undefined) {
    let json = fs.readFileSync(program.file);
    if(!json || json == "") {
        console.log(`\nERROR MESSAGE: ${program.file} is empty`);
    }
    try {
        data = JSON.parse(json);
    } catch(err) {
        console.log(json);
        shelljs.exit(1);
    }

}
if(data != undefined) {
    if(data.code != undefined && data.code == 200 && data.data instanceof Object ||
        data.status_code != undefined && data.status_code == 0 && data.data instanceof Object) {
            data = data.data;
    }
    if(program.include != undefined) {
        let dataTemp = {};
        let filter = program.include;
        if(data.records && Array.isArray(data.records)) { // 分页列表
            dataTemp.current = data.current;
            dataTemp.pages = data.pages;
            dataTemp.size = data.size;
            dataTemp.total = data.total;
            dataTemp.records = [];
            let records = data.records;
            for(let index in records) {
                let help = {};
                for(let i in filter) {
                    for(let item in records[index]) {
                        if(filter[i] == item) {
                            help[item]  = records[index][item];
                        }
                    }
                }
                dataTemp.records.push(help);
            }
        } else {
            for(let i in filter) {
                for(let item in data) {
                    if(filter[i] == item) {
                        dataTemp[item]  = data[item];
                    }
                }
            } 
        }
        data = dataTemp;
    } else if(program.exclude != undefined) {
        let filter = program.exclude;
        data = DataUtil.filterJson(data, filter);
    }
    let res;
    let md = {};
    if(program.convert != undefined) {
        res = convertToVTable(header, data, program.parent, program.sub, md);
    } else {
        res = convertToTable(header, data, program.parent, program.sub);
    }
    console.log(res);
    // output
    printLog(md.data, program.log);
    flag = 1;
}

if(program.pdf != undefined) {

}

if(flag == 0) {
    program.outputHelp(read);
} else {
    printLog("\n", program.log);
}

function read(txt) {
    return txt; 
}