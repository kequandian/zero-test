let fs = require("fs");
let dateUtil = require("./util/dateUtil");


function printLog(data, log) {
    if(log) {
        let config = JSON.parse(fs.readFileSync("./log-config.json", "UTF-8"));
        let basePath = config["basePath"];
    
        if(config["path"] == "default") {
            let file = basePath + dateUtil.getToday() + '.log';
            fs.appendFileSync(file, data + "\n", 'UTF-8');
       }
    }
}

module.exports = printLog;