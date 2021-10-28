var shelljs = require("shelljs");
var fs = require("fs");
var path = require("path");
var fielMap = require(`../config/file_map.config`);
var root = path.dirname(__dirname)

let Reader = {
    readText(file){
        return fs.readFileSync(file, "UTF-8");
    },
    readJson(file) {
        let result = fs.readFileSync(file, "UTF-8");
        let jsonresult;
        try {
            jsonresult = JSON.parse(result);
        } catch(err) {
            if(jsonresult == "") {
                console.log(`\n${file} is empty, please check your request again`);
                fs.writeFileSync(`${root}/${fielMap.response}`, `{"code": 0, "message": "${file} is empty, please check your request again"}`, "UTF-8");
                shelljs.exit(1);
            }
            console.log('read json error: ', err);
            fs.writeFileSync(`${root}/${fielMap.response}`, `{"code": 0, "message": "read json error! ${fs.readFileSync(file, "UTF-8")}"`, "UTF-8");
            shelljs.exit(1);
        }
         return jsonresult;
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
    },
    printJson(json){
        console.log(json);
    }
}

module.exports = Reader;