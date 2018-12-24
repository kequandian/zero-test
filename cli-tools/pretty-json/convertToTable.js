let Table = require("cli-table2");
let program = require('commander');
let fs = require('fs');
let charConfig = require('./table.config');

let maxLen = 60;
function truncated(str, len) {
    return str.substring(0, len) + "..."; 
}

/**
 * ###暂时停止维护###
 * json转横向表格
 * @param {string} header 
 * @param {string} json 
 * @param {boolean} parent 是否只生成父表
 * @param {boolean} sub 是否只生成子表
 */
function convertToTable(header, json, parent, sub) {
    let res = new Table({chars: charConfig, style:{head:[], border:[]}, wordWrap:true});
    if(header != undefined) {
        res.push([{colSpan: 2, content: header, hAlign:'center'}]);
    }

    // JSON转表格形式字符串，仅转2层, 第二层为对象时，数据下挂到另一表格中
    let subTable = "";
    for(let item in json) {
        let jsonString = JSON.stringify(json[item]);
        if(jsonString[0] == "{") {
            subTable += "\n" + convertToTable(`${header}#${item}`, json[item]);
            res.push([item, truncated(jsonString, maxLen)]);
        } else if(jsonString[0] == "[") {
            if(jsonString[1] == "{") {  // 对象数组时，每个对象末尾添加换货符
                let splitString = jsonString.split("\"},{\"");
                let splitLen = splitString.length;
                let formatString = "";
                for(let j in splitString) {
                    if(j < splitLen - 1) {
                        formatString += splitString[j] + "\"},\n{"
                    } else if(j == splitLen - 1) {
                        formatString += splitString[j];
                    }
                }
                res.push([`${item}`, {content:formatString}]);
            } else {
                res.push([`${item}`, {content:jsonString}]);
            }
            
        } else {
            res.push([item, {content:json[item]}]);
        }
    }
    
    if(parent && !sub) {
        return res.toString();
     } else if(sub && !parent) {
         return subTable;
     }
    return res.toString() + subTable;
}

module.exports = convertToTable;