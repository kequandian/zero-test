#!/usr/bin/env node
var shell = require("shelljs");
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
    .option('--pdf <inputFile> <outputFile>', "生成pdf,指定需转换的文件位置")
    .option('--test <json>')
    .option('--journal [journal-file]')
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
    .command('pdf <inputFile> <outputFile>')
    .action(function (inputFile, outputFile) {
        Pdf.export(inputFile, outputFile);
        return;
    });

    program
    .command('journal <cmd> [option]')
    .action(function (cmd, ...options) {
        if(cmd == "ls") {
            shell.exec(`ls pub/logs`);
        } else if(cmd == "current") {
            shell.exec(`echo ${shell.env.ENV_TEST_LOG}`);
        } else if(cmd == "rm" && options && options[0]) {
            shell.rm(`pub/logs/${options[0]}`);
            shell.exec(`ls pub/logs`);
        } else {
            console.log("Usage:");
            console.log("   journal ls");
            console.log("   journal current");
            console.log("   journal rm <journal-file>");
        }
        return;
    });


    // program
    // .command('swagger <action> [arguments]')
    // .description([
    //   'swagger 工具',
    //   '  -> swagger ls [filter] 列出 swagger 可用的 API',
    //   '  -> swagger format 重新 format swagger.json 文件',
    // ].join('\n'))
    // .action(function () {
    //   const [action, ...restArg] = arguments;
    //   const actionMap = {
    //     'ls': (filter) => {
    //       swaggerLs(filter);
    //     },
    //     'format': () => {
    //       swaggerFormat();
    //     },
    //     'undefined': () => {
    //       console.log('无效的 action。可选 ls | format');
    //     },
    //   };
    //   (actionMap[action] || actionMap[undefined])(...restArg);
    // })

program.parse(process.argv);

if(program.journal) {
    if(program.journal == true) {
        shell.exec(`export ENV_TEST_LOG=${DateUtil.getToday()}`);
    } else {
        shell.exec(`export ENV_TEST_LOG=${program.journal}`);
    }
}


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
        if (method && method.toUpperCase() === 'DELETE') {
            Http.actionAfterGetById(api, 'DELETE', program.head, program.tail);
        } else if(method && method.toUpperCase() === 'POST') {
            Gen.genarator(api, 'POST', program.table, program.swagger, genParams);
            Http.post(api, `${fileMap.gen}`);
        }  else if(method && method.toUpperCase() === 'PUT') {
            Gen.genarator(`${api}/{id}`, 'PUT', program.table, program.swagger, genParams);
            Http.putAfterGetById(api, `${fileMap.gen}`, program.head, program.tail);
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
