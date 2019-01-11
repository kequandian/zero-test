let fs = require("fs");
let dateUtil = require("./util/dateUtil");
let root = require("../../static/root.config")


function printLog(data, log) {
    if(log) {
        let config;
        try {
            config = JSON.parse(fs.readFileSync(`${root}/static/log-config.json`, "UTF-8"));
        } catch(err) {

        }
        let basePath = config ? config["dir"] : "pub/logs/";
    
        if(!config["file"] || config["file"] == "default") {
            let file = basePath + dateUtil.getToday();
            fs.appendFileSync(file, data + "\n", "utf-8");
       } else {
            fs.appendFileSync(`${basePath}${config["file"]}`, data + "\n", "utf-8");
       }
    }
}

module.exports = printLog;