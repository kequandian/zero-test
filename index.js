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
    .option('--out')
    .option('--report')
    .option('--parent')
    .option('--head')
    .option('--tail')
    .option('--notnull', "default option")
    .option('--all')
    .option('--table <value>', '指定数据库表生成请求参数')
    .option('--swagger', "从swagger中获取api所需字段信息生成请求参数")
    .option('--filter <value>', "添加或替换生成参数")
    .option('--only', "仅处理当前api，post/put请求后不带回get列表")
    .on('--help', function() {
        console.log("Example: login api admin 111111"),
        console.log("         journal help"),
        console.log("         get /api/cms/article/categories --out"),
        console.log(`         post /api/cms/article/categories --filter='{"key":"value","array":[1,2,3],"items":{"key":"value"}}' --out --table=article_category`),
        console.log("         test demo/testcase-demo demo/testcase-demo.pdf")
    });

program
    .command('login <endpoint> <account> <password> [report]')
    .action(function (endpoint, account, password, report) {
        Test.login(endpoint, account, password);
        if(report == "report") {
            shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.response} -c -t login--${account}  --log`);
        }
        
    });
program
    .command('pdf <outputFile>')
    .action(function (outputFile) {
        let logConf = Reader.readJson(`${fileMap.logConf}`);
        Pdf.export(`${logConf.dir}${logConf.file}`, outputFile);
    });

program
    .command('test <testcase> <journal-file>')
    .description('多api测试')
    .action(function (testcase, journalFile) {
        console.log("testcase running...");
        let logConf = Reader.readJson(`${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        let read = fileData.split("\r\n");
        fs.writeFileSync(fileMap.response, JSON.stringify({code : 200}, "UTF-8"));
        let num = 1;
        for(let i in read) {
            let exec = `${read[i]} --report`;
            if(read[i].replace(new RegExp(" ", "g"), "").length > 0 && read[i][0] != "#") {
                console.log(read[i]);
                exec = exec.replace(new RegExp('"', 'g'), '\\"').replace(new RegExp("'", "g"), "");
                shell.exec(`(${exec} > ${fileMap.testTemp})`);
                let response = Reader.readJson(`${fileMap.response}`, "UTF-8");
                if(response.code != 200 && response.status_code != 0) {
                    console.log(`\ntest error !!!`);
                    console.log(fs.readFileSync(`${fileMap.testTemp}`, "UTF-8"));
                    break;
                }
            } else if(read[i].replace(new RegExp(" ", "g"), "").length > 0 && read[i][0] == "#" && read[i][1] && read[i][1] != "#") {
                console.log(read[i]);
                let start = 1;
                while(read[i][start] == " ") {
                    start ++;
                }
                let end = read[i].length - 1;
                while(read[i][end] == " ") {
                    end --;
                }

                fs.appendFileSync(`${logConf.dir}${logConf.file}`, `## ${num ++}、${read[i].substring(start, end + 1)}\n`, "UTF-8", function(err) {
                    if(err) {
                        console.log(err.message);
                        shell.exit(1);
                    }
                });
            }
        }
        fileData = "# Testcase\n```\n" + fileData + "\n```\n---\n# Start\n"
        let testcaseLog = fs.readFileSync(`${logConf.dir}${logConf.file}`, "UTF-8");
        testcaseLog = fileData + testcaseLog;

        fs.writeFileSync(`${logConf.dir}${logConf.file}`, testcaseLog, "UTF-8");

        console.log(`export report: ${journalFile}`);
        Pdf.export(`${logConf.dir}${logConf.file}`, journalFile);
    });

    program
    .command('journal [cmd] [option]')
    .action(function (cmd, ...options) {
        let logConf = Reader.readJson(`${fileMap.logConf}`);
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
        } else if(cmd == "rewrite") {
            shell.exec(`true > ${logConf.dir}${logConf.file}`);
        }else if(!cmd || cmd == "help"){
            console.log("Usage:");
            console.log("   journal ls");
            console.log("   journal current");
            console.log("   journal set <journal-file>");
            console.log("   journal rm <journal-file>");
            console.log("   journal rewrite");
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

if (program.out) {
    // 输出api结果
    shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.response} ${params} -t ${method}--${originApi}`);
} else if (program.report) {
    console.log(`node ./cli-tools/pretty-json/index.js -f ${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
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
