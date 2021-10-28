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
var Save = require('./util/Save');
var Url = require(`./util/Url`);
let Testcase = require(`./util/Testcase`);
var DateUtil = require('./cli-tools/pretty-json/util/dateUtil');
var StringUtil = require('./cli-tools/api-gen/util/stringUtil');
var fileMap = require(`./config/file_map.config`);
var server = require(`./config/server.config`);
var apiMap = require(`./config/api.config`).map;
var ignore = require(`./config/api.config`).filter;
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
    .option('--token <value>', "指定鉴权token")
    .option('--only', "仅处理当前api，post/put请求后不带回get列表 (默认)")
    .option('--save <field>', '保存当前api返回的某字段值(id...), 通过#SAVE_VALUE使用该值')
    .on('--help', function() {
        console.log()
        console.log("Usage:")
        console.log("  login api admin 111111 report")
        console.log("  mysql --help")
        console.log("  server --help")
        console.log("  swagger --help")
        console.log("  pdf --help")
        console.log("  journal --help")
        console.log("  get /api/cms/article/categories --out");
        console.log(`  post /api/cms/article/categories --filter='{"key":"value","array":[1,2,3],"items":{"key":"value"}}' --out --table=article_category`)
        console.log("  test public/testcase/demo.tc output/demo.pdf")
    });

program
    .command('server <host> <port>')
    .action(function (host, port) {
        server.endpoint = `http://${host}:${port}`;
        console.log(server.endpoint);
        server = JSON.stringify(server, null, '\t');
        server = "module.exports=" + server;
        fs.writeFileSync(`${process.cwd()}/config/server.config`, server, 'UTF-8');
        
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
        fs.writeFileSync(`${process.cwd()}/config/server.config`, server, 'UTF-8');
        shell.exit(0);
    }).on('--help', function() {
        console.log("Example: mysql set host 127.0.0.1 3306"),
        console.log("         mysql set database zero-test"),
        console.log("         mysql set user root root")
    });
program
    .command('login <endpoint> <account> <password> [report]')
    .action(function (endpoint, account, password, report) {
        //console.log('Test.login: ', endpoint, account, password)
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
        console.log("   pdf demo/testcase.pdf --target=public/logs/testcase");
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
    .command('test <testcase> <journal-file> [options]')
    .description('测试报告-多api组合测试')
    .option('-f, --force', '执行整个testcase,不被错误返回所打断')
    .option('-r, --recreate', '测试前清空日志文件')
    .on('--help', function() {
        console.log('');
        console.log('Usage:');
        console.log('   test Wdemo/testcase demo/testcase.pdf');
    })
    .action(function (testcase, journalFile, ...options) {
        //console.log("testcase running...");
        Testcase.run(testcase, journalFile, options[0], options[1])
    });


///  main
/**
 * fix the input api for tty terminator
 * @param {*} api 
 */
function fixTtyApi(api){
    if(api){
        // ensure api start with slash/, just like /api
        if(api.indexOf('Git/') > 0) {
        api = api.substring(api.indexOf("Git/") > 0 ? api.indexOf("Git/") + 3 : 0);
        }else if(api.startsWith("https://") || api.startsWith("http://")){
            // skip 
        }else if( !(api.substring(0, 1) == "/") ) {
            api = "/" + api;
        }
    }
}

program.parse(process.argv);
// console.log('processing ', process.argv)
fixTtyApi(api)


if(!fs.existsSync(`${root}/${fileMap.save}`)) {
    shell.exec(`echo {} > ${root}/${fileMap.save}`);
}
let replaceValue = Reader.readJson(`${root}/${fileMap.save}`);

/// build params string

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

// api-gen 参数列表 : genParams
// --mysql=zero-test/config/server.config
let genParams = program.table ? ` --mysql=${process.cwd()}/${fileMap.server}` : '';
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
        // 未指定table与swagger时，仅处理filter
        genParams = `${program.filter}`;
    } else {
        program.filter = program.filter.replace(new RegExp('"', 'g'), '\\"');
        genParams += ` --filter=${program.filter}`;
    }
}
// end genParams

// swagger 
//let swagger = Swagger.getSwagger();

// 
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
        //console.log(`${api}, 'GET', ${program.head}, ${program.tail}, ${program.token}`)
        Http.actionAfterGetById(api, 'GET', program.head, program.tail, program.token);
        Save.saveValue(program.save);
        
        // if(program.head || program.tail ){
        //     shell.exit()
        // }
    } else if(method && 
            ( method.toUpperCase() === 'POST' 
            || method.toUpperCase() === 'PUT'
            || method.toUpperCase() === 'DELETE' )
            ) {
        let isSuccess = false;
        if (method && method.toUpperCase() === 'DELETE') {
            isSuccess = Http.actionAfterGetById(api, 'DELETE', program.head, program.tail);

        } else if(method && method.toUpperCase() === 'POST') {
            if(program.table && program.swagger){
                console.log('Options both --table and --swagger confict !')
                shell.exit(0);
            }
            Gen.genarator(api, 'POST', program.table, program.swagger, genParams);
            isSuccess = Http.post(api, `${root}/${fileMap.gen}`, program.token);

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

if (program.out || program.report) {
    // 输出api结果
    if (program.out) {
        console.log(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}`);
        shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}`);
    } else if (program.report) {
        // 输出并打印日志
        // -t --title
        console.log(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
        shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.response} ${params} -t ${method}--${originApi}  --log`);
    }

} else if(program.info && method && api) {
    console.log(`output swagger info: ${method} ${api}`);
    api = "/" + api;
    if(method && (method.toUpperCase() == "PUT" || method.toUpperCase() == "DELETE")) {
        api += "/{id}";
    }
    Swagger.writeFields(api, method, `${root}/${fileMap.params}`);
    shell.exec(`node ${root}/cli-tools/pretty-json/index.js -f ${root}/${fileMap.params} -c -s`);
}
