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
var Reader = require('./util/Reader');
var Formatter = require('./util/Formatter');
var StringUtil = require('./cli-tools/api-gen/util/StringUtil');
var Save = require('./util/Save');

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
    .option('--out', '输出结果')
    .option('--report', '输出并将结果记录日志')
    .option('--info', '从swagger中获取api描述')
    .option('--parent', '仅输出主表')
    .option('--head')
    .option('--tail')
    .option('--notnull', "default option")
    .option('--all')
    .option('--table <value>', '指定数据库表生成请求参数')
    .option('--swagger', "从swagger中获取api所需字段信息生成请求参数")
    .option('--filter <value>', "添加或替换生成参数")
    .option('--only', "仅处理当前api，post/put请求后不带回get列表")
    .option('--save <field>', '保存当前api返回的某字段值(id...), 通过#SAVE_VALUE使用该值')
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
        shell.exit(0);
    });

    
program
    .command('pdf <outputFile>')
    .option('--target <target_file>', '指定需转换成pdf的原文件, 不进行指定则默认转换当前所选日志文件')
    .on('--help', function() {
        console.log('');
        console.log('Usage:');
        console.log("   pdf demo/testcase.pdf");
        console.log("   pdf demo/testcase.pdf --target=pub/logs/testcase");
    })
    .action(function (outputFile, options) {
        if(options.target) {
            Pdf.export(options.target, outputFile);
        } else {
            let logConf = Reader.readJson(`${fileMap.logConf}`);
            Pdf.export(`${logConf.dir}${logConf.file}`, outputFile);
        }

    });

program
    .command('journal <cms> [option]')
    .on('--help', function() {
        console.log('');
        console.log('Usage:');
        console.log("   journal ls");
        console.log("   journal current");
        console.log("   journal set <journal-file>");
        console.log("   journal rm <journal-file>");
        console.log("   journal rewrite");
    })
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
        }
        shell.exit(0);
    });

program
    .command('server <cmd> [options]')
    .on('--help', function() {
        console.log("Usage:");
        console.log('');
        console.log("   server get");
        console.log("   server path");
    })
    .action(function (cmd, ...options) {
        let logConf = Reader.readJson(`${fileMap.logConf}`);
        if(cmd == "get") {
            shell.exec(`cat ./conf/server.config`);
        } else if(cmd == "path") {
            console.log("conf/server.config");
        }
    });

program
    .command('test <testcase> <journal-file>')
    .description('多api组合测试')
    .option('-f, --force', '执行整个testcase,不被错误返回所打断')
    .on('--help', function() {
        console.log('');
        console.log('Usage:');
        console.log('   test demo/testcase demo/testcase.pdf');
    })
    .action(function (testcase, journalFile, options) {
        console.log("testcase running..." + options.force);
        let logConf = Reader.readJson(`${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        let read = fileData.split("\r\n");
        fs.writeFileSync(fileMap.response, JSON.stringify({code : 200}, "UTF-8"));
        let num = 1;
        for(let i in read) {
            console.log(read[i]);
            let exec = `${read[i]} --report`;
            exec = StringUtil.replacePlaceholder(exec);
            exec = Formatter.replaceFilterBlank(exec);
            // 执行结果记录
            if(read[i].replace(new RegExp(" ", "g"), "").length > 0 && read[i][0] != "#") {
                exec = exec.replace(new RegExp('"', 'g'), '\\"').replace(new RegExp("'", "g"), "");
                shell.exec(`${exec} > ${fileMap.testTemp}`);
                let response = Reader.readJson(`${fileMap.response}`, "UTF-8");
                if(!options.force && response.code != 200 && response.status_code != 0) {
                    let errorInfo = fs.readFileSync(`${fileMap.testTemp}`, "UTF-8");
                    console.log(`\n\ntest error !!!`);
                    console.log(`---------------------------`);
                    console.log(errorInfo);
                    console.log(`---------------------------\n`);
                    //fs.appendFileSync(`${logConf.dir}${logConf.file}`, "```\n" + errorInfo + "\n```", "UTF-8");
                    break;
                }
            // 单'#'号注释记录
            } else if(read[i].replace(new RegExp(" ", "g"), "").length > 0 && read[i][0] == "#" && read[i][1] && read[i][1] != "#") {
                let start = 1;
                while(read[i][start] == " ") {
                    start ++;
                }
                let end = read[i].length - 1;
                while(read[i][end] == " ") {
                    end --;
                }

                fs.appendFileSync(`${logConf.dir}${logConf.file}`, `## ${num ++}、${read[i].substring(start, end + 1)}\n`, "UTF-8");
            }
        }
        fileData = "# Testcase\n```\n" + fileData + "\n```\n---\n# Start\n"
        let testcaseLog = fs.readFileSync(`${logConf.dir}${logConf.file}`, "UTF-8");
        testcaseLog = fileData + testcaseLog;

        testcaseLog = testcaseLog.replace(new RegExp('%26', 'g'), '&').replace(new RegExp('%20', 'g'), ' ');
        fs.writeFileSync(`${logConf.dir}${logConf.file}`, testcaseLog, "UTF-8");

        console.log(`export report: ${journalFile}`);
        Pdf.export(`${logConf.dir}${logConf.file}`, journalFile);
    });


program.parse(process.argv);

if(!program.report && !program.info && method && api) {
    program.out = true;
}

if(api && api.substring(0, 3) == "C:/") {
    api = api.substring(api.indexOf("Git/") > 0 ? api.indexOf("Git/") + 4 : 0);
}


if(!fs.existsSync(`${fileMap.save}`)) {
    shell.exec(`echo {} > ${fileMap.save}`);
}
let replaceValue = Reader.readJson(fileMap.save);
api = api ? StringUtil.replacePlaceholderByEncode(api, replaceValue) : api;

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
    if(replaceValue) {
        for(let item in replaceValue) {
            program.filter = program.filter.replace(new RegExp(item, "g"), replaceValue[item]);
        }
    }
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
        Save.saveValue(program.save);
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
        
        Save.saveValue(program.save);

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
} else if(program.info && method && api) {
    console.log(`output swagger info: ${method} ${api}`);
    api = "/" + api;
    if(method && (method.toUpperCase() == "PUT" || method.toUpperCase() == "DELETE")) {
        api += "/{id}";
    }
    Swagger.writeFields(api, method, `${fileMap.params}`);
    shell.exec(`node ./cli-tools/pretty-json/index.js -f ${fileMap.params} -c -s`);
}
