var shell = require("shelljs");
var fs = require('fs');
var path = require('path')
var fileMap = require(`../config/file_map.config`);
var StringUtil = require('../cli-tools/api-gen/util/stringUtil');
var Formatter = require('./Formatter');
var Reader = require('./Reader');
var Pdf = require('./Pdf');
var RestHttpParser = require('./RestHttpParser');
const { exit } = require("process");
var root = path.dirname(__dirname)

/**
 * 执行 testcase, 
 * @force  -- 遇到错误继续执行
 */
let Testcase = {
    // 由Parse结果转换为执行命令
    fromLineToExecutableLine(method, url, body, token){
        let exec
        if(body && token){
            exec = `node ./index.js ${method} ${url} --filter=${body} --token=${token} --report`
        }else if(body){
            exec = `node ./index.js ${method} ${url} --filter=${body} --report`
        }else if(token){
            exec = `node ./index.js ${method} ${url} --token=${token} --report`
        }else {
            exec = `node ./index.js ${method} ${url} --report`;
        }

        // handle login + --report
        if(method == 'login'){
            exec = `node ./index.js ${method} ${url}`;
        }

        exec = exec.replace(new RegExp('"', 'g'), '\\"')
                   .replace(new RegExp("'", "g"), "");

        //替换json对象中的占位符, 只支持个位天数 -9 ~ 9
        exec = StringUtil.replacePlaceholder(exec);

        //--filter='{}' 格式中的空格转换成其他字符
        exec = Formatter.replaceFilterBlank(exec);

        return exec
    },
    run(testcase, journalFile, force, append) {
        let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        fileData = fileData.replace("\r\n", "\n");
        fileData = fileData.indexOf("\n---")>0 ? fileData.substring(0,fileData.indexOf("\n---")) : fileData
        fileData = fileData+'\n';  //add newline anyway
        fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify({code : 200}, "UTF-8"));
        if(!append){
            // console.log('test recreate............')
            fs.writeFileSync(`${logConf.dir}${logConf.file}`, '', "UTF-8");
        }

        // read each line in testcase file
        let read = fileData.split("\n");
        let num = 1;
        for(let i in read) {
            let line = read[i]==undefined?'':read[i].trim()
            console.log(line)

            let readLineStatus = RestHttpParser.readEachLine(line)
            // console.log('readLineStatus=', readLineStatus)
            if(readLineStatus === 'terminated'){
                continue
            }

            // 执行结果记录
            if(readLineStatus === 'closed') {
                let methodLine = RestHttpParser.testMethod()
                let requestLine = RestHttpParser.testRequest()
                let bodyLine = RestHttpParser.testBody()
                let tokenLine = RestHttpParser.testToken()

                let lineExec = this.fromLineToExecutableLine(methodLine, requestLine, bodyLine, tokenLine)
                console.error(lineExec)
                shell.exec(`${lineExec} > ${root}/${fileMap.testTemp}`);

                // 错误中止
                let response = Reader.readJson(`${root}/${fileMap.response}`, "UTF-8");
                console.error(response)

                if(!force && response.code != 200 && response.status_code != 0) {
                    let errorInfo = fs.readFileSync(`${root}/${fileMap.testTemp}`, "UTF-8");
                    console.log(`\n\ntest error !!!`);
                    console.log(`---------------------------`);
                    console.log(errorInfo);
                    console.log(`---------------------------\n`);
                    //fs.appendFileSync(`${logConf.dir}${logConf.file}`, "```\n" + errorInfo + "\n```", "UTF-8");
                    break;
                }

            // 单'#'号注释记录
            } else if(line.length>0 && line.startsWith("## ")) {
                // 用于测试用例的注释,不打印到PDF
            } else if(line.length>0 && line.startsWith("#")) {
                // 把注释加到文档, 统一注释  ##
                line=line.replace("^[\\#]+ ", "")
                fs.appendFileSync(`${logConf.dir}${logConf.file}`, `## ${num ++}、${line}\n`, "UTF-8");
            }
        }

        // append testcase to log 
        let testcaseHeader = 
        "# Testcase\n"+
        "```\n" + 
        fileData + 
        "\n```\n---\n# " +
        "Start\n"
        let testcaseLog = fs.readFileSync(`${logConf.dir}${logConf.file}`, "UTF-8");
        testcaseLog = testcaseHeader + testcaseLog.replace(new RegExp('%26', 'g'), '&').replace(new RegExp('%20', 'g'), ' ');;
        
        fs.writeFileSync(`${logConf.dir}${logConf.file}`, testcaseLog, "UTF-8");
        Pdf.export(`${logConf.dir}${logConf.file}`, journalFile);
    }
}
module.exports = Testcase;