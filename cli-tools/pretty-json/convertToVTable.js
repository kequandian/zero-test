let Table = require("cli-table2");
let program = require('commander');
let fs = require('fs');
let StringUtil = require('./util/StringUtil');
let charConfig = require('./table.config');

function truncated(str, len) {
    return str.substring(0, len) + "..."; 
}
// 表格最大宽度
let maxTableSize = 400;

/**
 * json数组对象 -> table
 * 针对特殊情况， 如 {code:200,data:[{key:value}]}
 * @param {*} header 
 * @param {*} json 
 */
function convertArrayToTable(header, json, mdLog) {
    if(json == undefined) {
        return ;
    }
    let columnsNum = 1; // 数据列数 + 第一列（作为行号)
    let columnsTitle = [{content:'row', hAlign:'center'}];
    let log = "";
    if(json.length == 0) return;

    // id放第二列
    let dataRowOneId;
    if(!(json[0]["id"] instanceof Object)) {
        columnsTitle.push({content: "id", hAlign: "center"});
        log += `| row | id |`;
        hasId = true;
        dataRowOneId = json[0]["id"];
        delete json[0]["id"];
        columnsNum ++;
    }
    for(let item in json[0]) {
        let jsonString = JSON.stringify(json[0][item]);
        columnsTitle.push({content:item, hAlign:'center'});
        // if(columnsNum == 1) {
        //     log += `| row |`;
        // }
        log += ` ${item} |`
        columnsNum ++;

    }

    if(columnsNum > 0) {
        log += "\n|";
        for(let i = 0; i < columnsNum; i++) {
            log += ":----:|"
        }
        log +="\n|";
    }

    let maxColumnSize = Math.round(maxTableSize / columnsNum) - 3;
    let res = new Table({chars: charConfig, style:{head:[], border:[]}, wordWrap:true});

    if(header != undefined) {
        res.push([{colSpan: columnsNum, content: header, hAlign:'center'}]);
        log = `**${header}**\n${log}`;
    }
    res.push(columnsTitle);

    for(let index in json) {
        let rowData = [index];
        log += ` ${index} |`

        if(index == 0 && dataRowOneId != undefined) { // put dataRowOne id
            log += ` ${dataRowOneId} |`;
            rowData.push(dataRowOneId);
        }
        if(index != 0 && !(json[index]["id"] instanceof Object)) {    // put other row id
            log += ` ${json[index]["id"]} |`;
            rowData.push(json[index]["id"]);
            delete json[index]["id"];
        }

        for(let item in json[index]) {
            let itemString = JSON.stringify(json[index][item]);
            if(itemString[0] == '"' && itemString[itemString.length - 1] == '"') {
                itemString = itemString.substring(1, itemString.length - 1);
            }
            log += ` ${itemString} |`
            rowData.push(StringUtil.wordWrap(itemString, maxColumnSize));
        }
        log += "\n"
        res.push(rowData);
    }
    mdLog.data = log;
    return res.toString();
}


/**
 * json转列向表格
 * @param {string} header 
 * @param {string} json 
 * @param {boolean} parent 是否只生成父表
 * @param {boolean} sub 是否只生成子表
 * @param {object} mdLog
 */
function convertToVTable(header, json, parent, sub, mdLog) {
    let remainLen = 20;    // 单元格数据为对象或数组对象时保留长度
    let columnsNum = 0; // 列数
    let columnsTitle = []; 
    let subLog = "";
    let log = "";

    let dataRowOneId;
    if(json["id"] != undefined && !(json["id"] instanceof Object)) {
        columnsTitle.push("id");
        dataRowOneId = json["id"];
        delete json["id"];
        log += '| id |';
        columnsNum ++;
    }

    for(let item in json) {

        let jsonString = JSON.stringify(json[item]);
        // if(jsonString != undefined && (jsonString[0] == '{' || (jsonString[0] == '[' && jsonString[1] == '{'))) {
        //     // nothing
        // } else {
            columnsTitle.push(item);
            if(columnsNum == 0) {
                log += `|`;
            }
            log += ` ${item} |`
            columnsNum ++;
        // }
    }
    if(columnsNum > 0) {
        log += "\n|";
        for(let i = 0; i < columnsNum; i++) {
            log += ":----:|"
        }
        log +="\n|"
    }

    let maxColumnSize = Math.round(maxTableSize / columnsNum) - 3;
    let res = new Table({chars: charConfig, style:{head:[], border:[]}, wordWrap:true});
    if(header != undefined) {
        res.push([{colSpan: columnsNum, content: header, hAlign:'center'}]);
        log = `**${header}**\n${log}`;
    }
    res.push(columnsTitle);
    

    
    // JSON转表格形式字符串，仅转2层, 第二层为对象时，数据下挂到另一表格中
    let subTable = "";
    let rowData = [];

    if(dataRowOneId != undefined) {     // set id
        rowData.push(dataRowOneId);
        log += ` ${dataRowOneId} |`;
    }
    if(Array.isArray(json)) {       // 匹配 ：{data: []}
        if(json.length == 0) {
            
        } else {
            let jsonString = JSON.stringify(json);
            if(JSON.stringify(json[0])[0] == '{') { // 纯对象数组，只显示子表
                // let md = {};
                // subTable += "\n" + convertArrayToTable(`${header}`, json, md);
                // subLog += md.data == undefined ? "" : md.data + "\n";
                // let columnValue = jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString;
                // rowData.push({colSpan: columnsNum, content:columnValue});
                // log += ` ${columnValue} |`;
                let md = {};
                let result = convertArrayToTable(`${header}`, json, md);
                mdLog.data = md.data;
                return result;
            }
        }
    } else {
        for(let item in json) {
            let jsonString = JSON.stringify(json[item]);
            if(jsonString != undefined && jsonString[0] == "{") {   // 匹配 ：{data: {key: {}}}
                let md = {};
                subTable += "\n" + convertToVTable(`${header}#${item}`, json[item], undefined, undefined, md);
                subLog += md.data == undefined ? "" : md.data + "\n";
                let columnValue = jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString;
                rowData.push(columnValue);
                log += ` ${columnValue} |`;

            } else if(jsonString != undefined && jsonString[0] == "[") {    
                if(jsonString != undefined && jsonString[1] == '{') {   // 匹配 ：{data: {key: [{}]}}
                    // for(let i in json[item]) {
                    //     subTable += "\n" + convertToVTable(undefined, json[item][i]);
                    // }
                    let md = {};
                    subTable += "\n" + convertArrayToTable(`${header}#${item}`, json[item], md);
                    subLog += md.data == undefined ? "" : md.data + "\n";
                    let columnValue = jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString;
                    log += ` ${columnValue} |`;
                    rowData.push(columnValue);
                } else {    // 匹配 ：{data: {key: value}}
                    rowData.push(jsonString);
                    log += ` ${jsonString} |`;
                }
                
            } else {

                if(typeof json[item] == 'string') {
                    let columnValue = StringUtil.wordWrap(json[item], maxColumnSize);
                    rowData.push(columnValue);
                    log += ` ${json[item]} |`;
                }  else {
                    rowData.push(json[item]);
                    log += ` ${json[item]} |`;
                }
            }
        }
    }
    res.push(rowData);
    if(parent && !sub) {
        mdLog.data = log + "\n---\n";
       return res.toString();
    } else if(sub && !parent) {
        mdLog.data = subLog + "\n---\n";
        return subTable;
    }
    mdLog.data = log + "\n" + subLog + "\n---\n";
    return res.toString() + subTable;
}

module.exports = convertToVTable;