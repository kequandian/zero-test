#!/usr/bin/env node
var shell = require("shelljs");
var program = require('commander');
var fs = require('fs');
var path = require(`path`)
var Http = require('./util/Http');
var Test = require('./util/Test');
var Swagger = require('./util/Swagger');
var Gen = require('./util/Gen');
var Pdf = require('./util/Pdf');
var Reader = require('./util/Reader');
var Formatter = require('./util/Formatter');
var Save = require('./util/Save');
var Url = require(`./util/Url`);
var DateUtil = require('./cli-tools/pretty-json/util/dateUtil');
var StringUtil = require('./cli-tools/api-gen/util/stringUtil');
var fileMap = require(`./static/file_map.config`);
var server = require(`./test-env/server.config`);
var apiMap = require(`./test-env/api.config`).map;
var ignore = require(`./test-env/api.config`).filter;
var root = __dirname;


const { exit } = require("process");
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
        console.log();
        console.log("Usage:"),
        console.log("  login api admin 111111");
        console.log("  journal --help"),
        console.log("  get /api/cms/article/categories --out"),
        console.log(`  post /api/cms/article/categories --filter='{"key":"value","array":[1,2,3],"items":{"key":"value"}}' --out --table=article_category`),
        console.log("  test demo/testcase-demo demo/testcase-demo.pdf")
    });

program
    .command('server <host> <port>')
    .action(function (host, port) {
        server.endpoint = `http://${host}:${port}`;
        console.log(server.endpoint);
        server = JSON.stringify(server, null, '\t');
        server = "module.exports=" + server;
        fs.writeFileSync(`${process.cwd()}/test-env/server.config`, server, 'UTF-8');
        
        shell.exit(0);
    });
program
    .command('mysql <opt> [argv1] [argv2]')
    .description('mysql <host|database|user> [argv1] [argv2]')
    .action(function (opt, argv1, argv2) {
        if(opt == "host") {
            server.mysql.host = argv1;
            server.mysql.port = argv2;
        } else if(opt == "database") {
            server.mysql.database = argv1;
        } else if(opt == "user") {
            server.mysql.user = argv1;
            server.mysql.password = argv2 == undefined ? "" : argv2;
        } else {
            console.log('mysql set <host|database|user> [...argv]');
            shell.exit(1);
        }
        console.log(JSON.stringify(server.mysql, null, '\t'));
        server = JSON.stringify(server, null, '\t');
        server = "module.exports=" + server;
        fs.writeFileSync(`${process.cwd()}/test-env/server.config`, server, 'UTF-8');
        shell.exit(0);
    }).on('--help', function() {
        console.log("Example: mysql set host 127.0.0.1 3306"),
        console.log("         mysql set database zero-test"),
        console.log("         mysql set user root root")
    });
program
    .command('login <endpoint> <account> <password> [report]')
    .action(function (endpoint, account, password, report) {
        Test.login(endpoint, account, password);

        if(report == "report") {
            shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} -c -t login--${account}  --log`);
        }
        shell.exit(0);
    });
program
    .command('swagger <url>')
    .description('获取swagger.json')
    .action(function (url) {
        let curPath = process.cwd();
        shell.cd(`cd ${root}/cli-tools/zero-json`);
        shell.exec(`(curl ${url} --out swagger/index.json && node index.js swagger format && mv swagger/format.json ${curPath}/test-env/pub/swagger.json)`);
        shell.exit(0);
    });
    
program
    .command('pdf <outputFile>')
    .option('--target <target_file>', '指定需转换成pdf的原文件, 不进行指定则默认转换当前所选日志文件')
    .on('--help', function() {
        console.log('');
        console.log('Usage:');
        console.log("   pdf demo/testcase.pdf");
        console.log("   pdf demo/testcase.pdf --target=test-env/pub/logs/testcase");
    })
    .action(function (outputFile, options) {
        let source = options.target
        if(source) {
            //console.log('source=',source, 'outputFile=',outputFile)
            Pdf.export(source, outputFile);
        } else {
            let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
            let source = path.join(logConf.dir, logConf.file)
            console.log('source=',source, 'outputFile=',outputFile)
            Pdf.export(source, outputFile);
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
        let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
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
            fs.writeFileSync(`${root}/${fileMap.logConf}`, JSON.stringify(logConf), "UTF-8");
        } else if(cmd == "rewrite") {
            shell.exec(`true > ${logConf.dir}${logConf.file}`);
        }
        shell.exit(0);
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
        let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        let read = fileData.split("\r\n");
        fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify({code : 200}, "UTF-8"));
        let num = 1;
        for(let i in read) {
            console.log(read[i]);
            let exec = `${read[i]} --report`;
            exec = StringUtil.replacePlaceholder(exec);
            exec = Formatter.replaceFilterBlank(exec);
            // 执行结果记录
            if(read[i].replace(new RegExp(" ", "g"), "").length > 0 && read[i][0] != "#") {
                exec = exec.replace(new RegExp('"', 'g'), '\\"').replace(new RegExp("'", "g"), "");
                shell.exec(`${exec} > ${root}/${fileMap.testTemp}`);
                let response = Reader.readJson(`${root}/${fileMap.response}`, "UTF-8");
                if(!options.force && response.code != 200 && response.status_code != 0) {
                    let errorInfo = fs.readFileSync(`${root}/${fileMap.testTemp}`, "UTF-8");
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

if(api){
    // ensure api start with slash/, just like /api
    if(api.substring(0, 3) == "C:/") {
       api = api.substring(api.indexOf("Git/") > 0 ? api.indexOf("Git/") + 3 : 0);
    }else if( !(api.substring(0, 1) == "/") ) {
        api = "/" + api;
    }
}

if(!fs.existsSync(`${root}/${fileMap.save}`)) {
    shell.exec(`echo {} > ${root}/${fileMap.save}`);
}
let replaceValue = Reader.readJson(`${root}/${fileMap.save}`);

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
        params += ` --body=${root}/${fileMap.gen}`;
}


// api-gen参数列表
let genParams = ` --mysql=${process.cwd()}/${fileMap.server}`;
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
// 替换api中的预设的占位符，且对其进行url编码
api = api ? StringUtil.replacePlaceholderByEncode(api, replaceValue) : api;
api = api ? Url.urlEncode(api) : api;

if(!program.report && !program.info && method && api) {
    program.out = true;
}
if(program.out || program.report) {
    if (method && method.toUpperCase() === 'GET') {
        if(program.head && program.tail){
            console.log('Options: both --head --tail confict !')
            shell.exit(0)
        }
        if(program.head || program.tail){
           Http.actionAfterGetById(api, 'GET', program.head, program.tail);
           Save.saveValue(program.save);
        }
    } else if(method && (method.toUpperCase() === 'DELETE' || method.toUpperCase() === 'POST' 
            || method.toUpperCase() === 'PUT')) {
        let isSuccess = false;
        if (method && method.toUpperCase() === 'DELETE') {
            isSuccess = Http.actionAfterGetById(api, 'DELETE', program.head, program.tail);
        } else if(method && method.toUpperCase() === 'POST') {
            if(!program.table && !program.swagger){
                console.log('either --table or --swagger should be provided !')
                shell.exit(0);
            }
            Gen.genarator(api, 'POST', program.table, program.swagger, genParams);
            isSuccess = Http.post(api, `${root}/${fileMap.gen}`);
        }  else if(method && method.toUpperCase() === 'PUT') {
            Gen.genarator(`${api}/{id}`, 'PUT', program.table, program.swagger, genParams);
            isSuccess = Http.putAfterGetById(api, `${root}/${fileMap.gen}`, program.head, program.tail);
        }
        Save.saveValue(program.save);
        if(isSuccess && !program.only) {
            if(apiMap[originApi]) {
                Test.run(apiMap[originApi], 'GET');   
            } else {
                Test.run(originApi, 'GET');   
            }
        }
    } else {
        shell.exit(0);
    }
}

if(program.head) {
    originApi = `head:${originApi}`;
} else if(program.tail) {
    originApi = `tail:${originApi}`;
}
if (program.out) {
    // 输出api结果
    shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}`);
} else if (program.report) {
    console.log(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
    // 输出并打印日志
    shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
} else if(program.info && method && api) {
    console.log(`output swagger info: ${method} ${api}`);
    api = "/" + api;
    if(method && (method.toUpperCase() == "PUT" || method.toUpperCase() == "DELETE")) {
        api += "/{id}";
    }
    Swagger.writeFields(api, method, `${root}/${fileMap.params}`);
    shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.params} -c -s`);
}
