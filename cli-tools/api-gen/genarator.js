let mysql = require('mysql');  
let dateUtil = require("./util/dateUtil");
let fs = require("fs");
let StringUtil = require("./util/StringUtil");
let shelljs = require("shelljs");



let genarator = {
    /**
     * 
     * @param {string} table_info 
     * @param {string} filter 替换/添加key-value {key:value,key2:value2}
     * @param {string} isAll 是否全部生成
     * @param  {...string} field 指定额外字段
     */
    genarateValuesByTable(table_info, filter,isAll, ...field) {
        let resJson = JSON.parse(JSON.stringify(table_info));
        let request = {};
        for(let row in resJson) {
            if(isAll) {
                if(resJson[row]["Extra"] != "auto_increment") {
                    request[resJson[row]["Field"]] = generateFieldValue(resJson[row]["Type"]);
                }
            } else {
                if(resJson[row]["Null"] == "NO" && resJson[row]["Default"] == null &&
                    resJson[row]["Extra"] != "auto_increment") {
                    request[StringUtil.underlineToUpCase(resJson[row]["Field"])] = generateFieldValue(resJson[row]["Type"]);
                }
                for(let index in field) {
                    if(field[index] == resJson[row]["Field"]) {
                        request[StringUtil.underlineToUpCase(resJson[row]["Field"])] = generateFieldValue(resJson[row]["Type"]);
                        delete field[index];
                        break;
                    }
                }
            }
        }

                /** 添加或替换字段 */
                if(filter) {
                    let arr = filter.substring(1, filter.length - 1).split(",");
                    for(let item in arr) {
                        let map = arr[item].split(":");
                        request[map[0]] = map[1];
                    }
                }
        return fieldFilter(request, filter);
    },

     /**
     * info接收格式
     * [
     *       {
     *         "field": "display",
     *         "label": "display",
     *         "type": "number"
     *       }
     * ]
     * type = [number, integer, input, date]
     */
    /**
     * 
     * @param {string} info 
     * @param {string} filter  替换/添加key-value {key:value,key2:value2}
     */
    genarateValuesBySwagger(info, filter) {
        let resJson = JSON.parse(JSON.stringify(info));
        
        let request = {};
        for(let row in resJson) {
            request[resJson[row]["field"]] = generateFieldValue(resJson[row]["type"]);
        }
        
        return fieldFilter(request, filter);
    }
}
function fieldFilter(json, filter) {
    let filterJson
    try {
        filterJson = JSON.parse(filter);
    } catch(err) {
        console.log(`${err.message} : ${filter}`);
        shelljs.exit(1);
    }
    /** 添加或替换字段 */
    if(filter) {
        for(let item in filterJson) {
            json[item] = filterJson[item];
        }
    }
    return json;
}

function generateFieldValue(fieldType) {
    let result;
    if(fieldType.match("varchar")) {
        let len = fieldType.substring(8, fieldType.length - 1);
        result = StringUtil.random(len - 10 > 0 ? len - 10 : len) + len;
    } else if(fieldType.match("bigint") || fieldType.match("int") || fieldType.match("smallint") || fieldType.match("tinyint")) {
        result = Math.round(30000 * Math.random());
    } else if(fieldType.match("tinyint")) {
        result = Math.round( 127 * Math.random());
    } else if(fieldType.match("datatime") || fieldType.match("timestamp") || fieldType.match("date")) {
        result = dateUtil.getRandomDate();
    } else if(fieldType.match("float") || fieldType.match("double") || fieldType.match("decimal")) {
        result = 1000 * Math.random();
    } else if(fieldType.match("text")) {
        result = StringUtil.random(255);
    } else if(fieldType == "input") {
        let len = 8;
        result = StringUtil.random(len);
    } else if(fieldType == "integer") {
        result = Math.round(30000 * Math.random());
    } else if(fieldType == "number") {
        result = Math.round( 127 * Math.random());
    } else if(fieldType == "date") {
        result = dateUtil.getRandomDate();
    }


    return result;
}

module.exports = genarator;
