#!/usr/bin/env node
var shell = require("shelljs");
var program = require('commander');
var fs = require('fs');
var server = require('./server.config');
var Http = require('./util/Http');
var Test = require('./util/test');
var Swagger = require('./util/Swagger');
var Gen = require('./util/Gen');
var apiMap = require('./api.config').map;
var ignore = require('./api.config').filter;

function map(key, value) {
    let result = new Map();
    map.put(key, value);
    return map;
}

let method;
let api;
program
    .usage('<method> <api> [options] [value ...]')
    .version('0.1.0')
    .arguments('<method> <api> ')
    .action(function (cmd, value) {
        method = cmd;
        api = value;
    })
    // .option('login <api|rest> <username> <password>', "登录")
    .option('-o, --out')
    .option('-r, --report', "输出并记录日志")
    .option('-p, --parent')
    .option('--head')
    .option('--tail')
    .option('--notnull', "默认值, 仅生成notnull字段")
    .option('--all')
    .option('--table, <value>', '指定数据库表生成请求参数')
    .option('--swagger', "从swagger中获取字段信息生成请求参数, 默认值")
    .option('--filter <value>', "添加或替换生成参数 {key1:value1,key2:value2}")
    .option('--only', "仅处理当前api，post/put请求后不带回get列表")
    .option('--pdf <value>', "生成pdf,指定需转换的文件位置")
    .on('--help', function() {
        console.log(""),
        console.log("Example: GET api/cms/article/categories --out"),
        console.log("         login api admin 111111")
    });

program
    .command('login <endpoint> <account> <password>')
    .action(function (endpoint, account, password) {
        Test.login(endpoint, account, password);
        shell.exit(0);
    });
program.parse(process.argv);

if(api && api.substring(0, 3) == "C:/") {
    api = api.substring(api.indexOf("Git/") > 0 ? api.indexOf("Git/") + 4 : 0);
}
if(program.pdf) {
    shell.exec(`java -jar ./cli-tools/pdf-outter-1.0.jar ${program.pdf}`);
    console.log("conver pdf success");
    return;
}


// pretty-json参数列表
let params = "-c ";
if(ignore && ignore.length > 0) {
    params += " --exclude=";
    for(let item in ignore) {
        if(item > 0) {
            params += ",";
        }
        params += ignore[item];
    }
}
if (program.parent) {
    params += " --parent";
}



// api-gen参数列表
let genParams = "";
if(program.all) {
    genParams += " --all";
}
if(program.filter) {
    genParams += ` --filter=${program.filter}`;
}

let swagger = Swagger.getSwagger();
let originApi = api;
if(program.out || program.report) {
    
    if (method && method.toUpperCase() === 'GET') {
        Http.actionAfterGetById(api, 'GET', program.head, program.tail);
    } else {
        if (method && method.toUpperCase() === 'DELETE') {
            Http.actionAfterGetById(api, 'DELETE', program.head, program.tail);
        } else if(method && method.toUpperCase() === 'POST') {
            Gen.genarator(api, 'POST', program.table, genParams);
            Http.post(api, './gen.json');
    
        }  else if(method && method.toUpperCase() === 'PUT') {
            Gen.genarator(`${api}/{id}`, 'PUT', program.table, genParams);
            Http.putAfterGetById(api, './gen.json', program.head, program.tail);
        }
        
        if(!program.only) {
            if(apiMap[originApi]) {
                Test.run(apiMap[originApi], 'GET');   
            } else {
                Test.run(originApi, 'GET');   
            }
        } 
    } 
}
if (program.out != undefined) {
    // 输出api结果
    shell.exec(`node ./cli-tools/pretty-json/index.js -f temp/response.json ${params} -t ${method}--${originApi}`);
} else if (program.report != undefined) {
    // 输出并打印日志
    shell.exec(`node ./cli-tools/pretty-json/index.js -f temp/response.json ${params} -t ${method}--${originApi}  --log`);
} else if(method && api) {
        console.log(`output swagger info: ${method} ${api}`);
        api = "/" + api;
        if(method && (method.toUpperCase() == "PUT" || method.toUpperCase() == "DELETE")) {
            api += "/{id}";
        }
        Swagger.writeFields(api, method, 'temp/params.json');
        shell.exec(`node ./cli-tools/pretty-json/index.js -f temp/params.json -c -s`);
        
}


