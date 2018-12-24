var shelljs = require("shelljs");
var fs = require("fs");

let Reader = {
    readJson(file) {
        let result = fs.readFileSync(file, "UTF-8");
        try {
            result = JSON.parse(result);
        } catch(err) {
            console.log(`read json error!\n${result}`);
            shelljs.exit(1);
        }
         return result;
    }
}

module.exports = Reader;