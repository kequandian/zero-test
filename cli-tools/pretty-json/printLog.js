let fs = require("fs");
let path = require('path')
let dateUtil = require("./util/dateUtil");
var root = path.dirname(path.dirname(__dirname))

function printLog(data, log) {
    if(log) {
        let config;
        try {
            config = JSON.parse(fs.readFileSync(`${root}/test-env/log-config.json`, "UTF-8"));
            //console.log('printLog:config=', config)
        } catch(err) {
            config.log('printLog:err=', err)
        }

        let basePath = config ? config["dir"] : "test-env/pub/logs/";
        //console.log('basePath=', basePath)

        if(!config["file"] || config["file"] == "default") {
            let filePath = path.join(root, basePath + dateUtil.getToday());
            if(!fs.existsSync(filePath)){
                fs.mkdirSync(path.dirname(filePath))
            }
            //console.log('printLog:filePath=', filePath)
            fs.appendFileSync(filePath, data + "\n", "utf-8");
       } else {
            let filePath = path.join(root, basePath, config["file"])
            if(!fs.existsSync(filePath)){
                fs.mkdirSync(path.dirname(filePath))
            }
            //console.log('printLog:filePath=', filePath)
            fs.appendFileSync(filePath, data + "\n", "utf-8");
       }
    }
}

module.exports = printLog;