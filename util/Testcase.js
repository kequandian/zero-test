var shell = require("shelljs");
var fs = require('fs');
var path = require('path')
var fileMap = require(`../config/file_map.config`);
var StringUtil = require('../cli-tools/api-gen/util/stringUtil');
var Formatter = require('./Formatter');
var Reader = require('./Reader');
var RestHttpParser = require('./RestHttpParser');
var root = path.dirname(__dirname)

/**
 * 执行 testcase, 
 * @force  -- 遇到错误继续执行
 */
let Testcase = {
    run(testcase, journalFile, force) {
        let logConf = Reader.readJson(`${root}/${fileMap.logConf}`);
        let fileData = fs.readFileSync(testcase, "UTF-8");
        fileData = fileData.replace("\r\n", "\n");
        fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify({code : 200}, "UTF-8"));

        // handle vsocde rest client .http file
        if(testcase.endsWith(".http")){
            let result = RestHttpParser.parseHttpContent(fileData)
            //TODO, 
        }


        // read testcase for lines
        let read = fileData.split("\n");
        let num = 1;
        for(let i in read) {
            let line = read[i]
            
            let exec = (line==null || line == '' || line.startsWith("#"))? line : `node ./index.js ${line} --report`;
            //替换json对象中的占位符, 只支持个位天数 -9 ~ 9
            exec = StringUtil.replacePlaceholder(exec);
            //--filter='{}' 格式中的空格转换成其他字符
            exec = Formatter.replaceFilterBlank(exec);

            // 执行结果记录
            if(line.replace(new RegExp(" ", "g"), "").length > 0 && line[0] != "#") {
                exec = exec.replace(new RegExp('"', 'g'), '\\"').replace(new RegExp("'", "g"), "");
                shell.exec(`${exec} > ${root}/${fileMap.testTemp}`);
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
    }
}
module.exports = Testcase;