var shell = require("shelljs");
var fs = require('fs');
var path = require('path')
var fileMap = require(`../config/file_map.config`);
var StringUtil = require('../cli-tools/api-gen/util/stringUtil');
var Formatter = require('./Formatter');
var Reader = require('./Reader');
var Pdf = require('./Pdf');
var RestHttpParser = require('./RestHttpParser');
var root = path.dirname(__dirname)

/**
 * 执行 testcase, 
 * @force  -- 遇到错误继续执行
 */
let Testcase = {
    fromLineToExecutableLine(method, url, body){

        // TODO, handle body
        let exec = `node ./index.js ${method} ${url} --report`;


        exec = exec.replace(new RegExp('"', 'g'), '\\"').replace(new RegExp("'", "g"), "");

        //替换json对象中的占位符, 只支持个位天数 -9 ~ 9
        exec = StringUtil.replacePlaceholder(exec);
        //--filter='{}' 格式中的空格转换成其他字符
        exec = Formatter.replaceFilterBlank(exec);

        return exec
    },
    run(testcase, journalFile, force, recreate) {
        let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        fileData = fileData.replace("\r\n", "\n");
        fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify({code : 200}, "UTF-8"));
        if(recreate){
            fs.writeFileSync(`${logConf.dir}${logConf.file}`, '', "UTF-8");
        }

        // let httpTests = {}
        // // handle vsocde rest client .http file
        // if(testcase.endsWith(".http")){
        //     httpTests = RestHttpParser.parseHttpContent(fileData)
        //     console.log(httpTests)
        // }
        //let isHttpCase = Object.keys(httpTests).length === 0


        // read each line in testcase file
        let read = fileData.split("\n");
        let num = 1;
        for(let i in read) {
            let line = read[i]==undefined?'':read[i].trim()
            console.log(line)

            let readLineStatus = RestHttpParser.readEachLine(line)

            // 执行结果记录
            if(readLineStatus === 'closed') {
                let methodLine = RestHttpParser.testMethod()
                let requestLine = RestHttpParser.testRequest()
                let bodyLine = RestHttpParser.testBody()

                let lineExec = this.fromLineToExecutableLine(methodLine, requestLine, bodyLine)
                shell.exec(`${lineExec} > ${root}/${fileMap.testTemp}`);

                let response = Reader.readJson(`${root}/${fileMap.response}`, "UTF-8");

                // 错误中止
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
            } else if(line.length>0 && line.startsWith("#")) {
                // 把注释加到文档, 统一注释  ##
                line= line.replaceAll("^[\\#]+ ", "")
                fs.appendFileSync(`${logConf.dir}${logConf.file}`, `## ${num ++}、${line}\n`, "UTF-8");
            }
        }

        // start test 
        let testcaseFileContent = "# Testcase\n```\n" + fileData + "\n```\n---\n# Start\n"
        let testcaseLog = fs.readFileSync(`${logConf.dir}${logConf.file}`, "UTF-8");
        testcaseLog = testcaseFileContent + testcaseLog;
        testcaseLog = testcaseLog.replace(new RegExp('%26', 'g'), '&').replace(new RegExp('%20', 'g'), ' ');
        fs.writeFileSync(`${logConf.dir}${logConf.file}`, testcaseLog, "UTF-8");

        console.log(`export report: ${journalFile}`);
        Pdf.export(`${logConf.dir}${logConf.file}`, journalFile);
    }
}
module.exports = Testcase;