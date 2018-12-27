#!/usr/bin/env node
var shell = require("shelljs");
var shellEnv = require('shelljs/global');
var program = require('commander');
var fs = require('fs');
var server = require('./conf/server.config');
var Http = require('./util/Http');
var Test = require('./util/test');
var Swagger = require('./util/Swagger');
var Gen = require('./util/Gen');
var apiMap = require('./conf/api.config').map;
var ignore = require('./conf/api.config').filter;
var Pdf = require('./util/Pdf');
var DateUtil = require('./cli-tools/pretty-json/util/DateUtil');
var fileMap = require('./conf/file_map.config');
var Reader = require('./util/Reader');

function map(key, value) {
    let result = new Map();
    map.put(key, value);
    return map;
}

let method;
let api;
program
    .usage('<method> <api> [options] [value ...]')
    .arguments('<method> <api> ')
    .action(function (cmd, value) {
        method = cmd;
        api = value;
    })
    .option('-o, --out')
    .option('-r, --report', "输出并记录日志")
    .option('-p, --parent')
    .option('--head')
    .option('--tail')
    .option('--notnull', "默认值, 仅生成notnull字段")
    .option('--all')
    .option('--table, <value>', '指定数据库表生成请求参数')
    .option('--swagger', "从swagger中获取字段信息生成请求参数")
    .option('--filter <value>', "添加或替换生成参数 {key1:value1,key2:value2}")
    .option('--only', "仅处理当前api，post/put请求后不带回get列表")
    .option('--test <json>')
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
program
    .command('pdf <outputFile>')
    .action(function (outputFile) {
        let logConf = Reader.readJson('./log-config.json');
        Pdf.export(`${logConf.dir}${logConf.file}`, outputFile);
        return;
    });

    program
    .command('journal <cmd> [option]')
    .action(function (cmd, ...options) {
        let logConf = Reader.readJson('./log-config.json');
        if(cmd == "ls") {
            shell.exec(`ls ${logConf.dir}`);
        } else if(cmd == "current") {
            shell.exec(`echo ${logConf.file}`);
        } else if(cmd == "rm" && options && options[0]) {
            shell.rm(`${logConf.dir}${options[0]}`);
            shell.exec(`ls ${logConf.dir}`);
        } else if(cmd == "set") {
            if(options && options[0]) {
                logConf.file = options[0];
            } else {
                logConf.file = DateUtil.getToday();
            } 
            fs.writeFileSync(`${fileMap.logConf}`, JSON.stringify(logConf), "UTF-8");
        }else {
            console.log("Usage:");
            console.log("   journal ls");
            console.log("   journal current");
            console.log("   journal rm <journal-file>");
        }
        shell.exit(0);
    });

program.parse(process.argv);


if(api && api.substring(0, 3) == "C:/") {
    api = api.substring(api.indexOf("Git/") > 0 ? api.indexOf("Git/") + 4 : 0);
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
if(method && method.toUpperCase() === 'POST'
    || method && method.toUpperCase() === 'PUT') {
        params += ` --body=${fileMap.gen}`;
}



// api-gen参数列表
let genParams = "";
if(program.all) {
    genParams += " --all";
}
if(program.filter) {
    if(!program.table && !program.swagger) {
        // 未指定table 与swagger时，仅处理filter
        genParams = `${program.filter}`;
    } else {
        program.filter = program.filter.replace(new RegExp('"', 'g'), '\\"');
        genParams += ` --filter=${program.filter}`;
    }
}

let swagger = Swagger.getSwagger();
let originApi = api;
if(program.out || program.report) {
    if (method && method.toUpperCase() === 'GET') {
        Http.actionAfterGetById(api, 'GET', program.head, program.tail);
    } else {
        let isSuccess = false;
        if (method && method.toUpperCase() === 'DELETE') {
            isSuccess = Http.actionAfterGetById(api, 'DELETE', program.head, program.tail);
        } else if(method && method.toUpperCase() === 'POST') {
            Gen.genarator(api, 'POST', program.table, program.swagger, genParams);
            isSuccess = Http.post(api, `${fileMap.gen}`);
        }  else if(method && method.toUpperCase() === 'PUT') {
            Gen.genarator(`${api}/{id}`, 'PUT', program.table, program.swagger, genParams);
            isSuccess = Http.putAfterGetById(api, `${fileMap.gen}`, program.head, program.tail);
        }
        
        if(isSuccess && !program.only) {
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
    shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.response} ${params} -t ${method}--${originApi}`);
} else if (program.report != undefined) {
    
    // 输出并打印日志
    shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
} else if(method && api) {
    console.log(`output swagger info: ${method} ${api}`);
    api = "/" + api;
    if(method && (method.toUpperCase() == "PUT" || method.toUpperCase() == "DELETE")) {
        api += "/{id}";
    }
    Swagger.writeFields(api, method, `${fileMap.params}`);
    shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.params} -c -s`);
}
