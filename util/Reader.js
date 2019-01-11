var shelljs = require("shelljs");
var fs = require("fs");
var fielMap = require(`../static/file_map.config`);
var root =require('../static/root.config');

let Reader = {
    readJson(file) {
        let result = fs.readFileSync(file, "UTF-8");
        try {
            result = JSON.parse(result);
        } catch(err) {
            if(result == "") {
                console.log(`\n${file} is empty, please check your request again`);
                fs.writeFileSync(`${root}/${fielMap.response}`, `{"code": 0, "${file} is empty, please check your request again`, "UTF-8");
                shelljs.exit(1);
            }
            console.log(`read json error!\n${result}`);
            fs.writeFileSync(`${root}/${fielMap.response}`, `{"code": 0, "message": "read json error! ${fs.readFileSync(file, "UTF-8")}"`, "UTF-8");
            shelljs.exit(1);
        }
         return result;
    },
    parseJson(string) {
        let result;
        try {
            result = JSON.parse(string);
        } catch(err) {
            console.log(`read json string error!\n${string}`);
            console.log(err.stack);
            shelljs.exit(1);
        }
         return result;
    }
}

module.exports = Reader;