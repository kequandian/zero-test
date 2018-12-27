var shelljs = require("shelljs");
var fs = require("fs");

let Reader = {
    readJson(file) {
        let result = fs.readFileSync(file, "UTF-8");
        try {
            result = JSON.parse(result);
        } catch(err) {
            if(result == "") {
                console.log(`\nresponse if empty, please check your request again`);
                shelljs.exit(1);
            }
            console.log(`read json error!\n${result}`);
            shelljs.exit(1);
        }
         return result;
    }
}

module.exports = Reader;