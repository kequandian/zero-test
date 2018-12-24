let fs = require("fs");
let dateUtil = require("./util/dateUtil");


function printLog(data, log) {
    if(log) {
        let config;
        try {
            config = JSON.parse(fs.readFileSync("./log-config.json", "UTF-8"));
        } catch(err) {

        }
        let basePath = config ? config["basePath"] : "logs";
    
        if(!config["path"] || config["path"] == "default") {
            let file = basePath + dateUtil.getToday() + '.log';
           fs.appendFileSync(file, data + "\n", "utf-8");
       }
    }
}

module.exports = printLog;