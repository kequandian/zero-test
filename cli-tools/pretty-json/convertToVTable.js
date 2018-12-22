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
function convertArrayToTable(header, json) {
    let columnsNum = 1; // 数据列数 + 第一列（作为行号)
    
    let columnsTitle = [{content:'row', hAlign:'center'}];
    if(json.length == 0) return;
    for(let item in json[0]) {
        let jsonString = JSON.stringify(json[0][item]);
        columnsTitle.push({content:item, hAlign:'center'});
        columnsNum ++;
    }
    let maxColumnSize = Math.round(maxTableSize / columnsNum) - 3;
    let res = new Table({chars: charConfig, style:{head:[], border:[]}, wordWrap:true});

    if(header != undefined) {
        res.push([{colSpan: columnsNum, content: header, hAlign:'center'}]);
    }
    res.push(columnsTitle);

    for(let index in json) {
        let rowData = [index];
        for(let item in json[index]) {
            rowData.push(StringUtil.wordWrap(json[index][item], maxColumnSize));
        }
        res.push(rowData);
    }
    
    return res.toString();
}

/**
 * json转列向表格
 * @param {string} header 
 * @param {string} json 
 * @param {boolean} parent 是否只生成父表
 * @param {boolean} sub 是否只生成子表
 */
function convertToVTable(header, json, parent, sub) {
    let remainLen = 20;    // 单元格数据为对象或数组对象时保留长度
    let columnsNum = 0; // 列数
    let columnsTitle = []; 
    
    for(let item in json) {
        let jsonString = JSON.stringify(json[item]);
        // if(jsonString != undefined && (jsonString[0] == '{' || (jsonString[0] == '[' && jsonString[1] == '{'))) {
        //     // nothing
        // } else {
            columnsTitle.push(item);
            columnsNum ++;
        // }
    }
    let maxColumnSize = Math.round(maxTableSize / columnsNum) - 3;
    //-
    let res = new Table({chars: charConfig, style:{head:[], border:[]}, wordWrap:true});
    if(header != undefined) {
        res.push([{colSpan: columnsNum, content: header, hAlign:'center'}]);
    }
    res.push(columnsTitle);

    
    // JSON转表格形式字符串，仅转2层, 第二层为对象时，数据下挂到另一表格中
    let subTable = "";
    let rowData = [];
    if(Array.isArray(json)) {       // 匹配 ：{data: []}
        if(json.length == 0) {
            
        } else {
            let jsonString = JSON.stringify(json);
            if(JSON.stringify(json[0])[0] == '{') {
                subTable += "\n" + convertArrayToTable(`${header}`, json);
                rowData.push({colSpan: columnsNum, content:jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString});
            }
        }
    } else {
        for(let item in json) {
            let jsonString = JSON.stringify(json[item]);
            
            if(jsonString != undefined && jsonString[0] == "{") {   // 匹配 ：{data: {key: {}}}
                subTable += "\n" + convertToVTable(`${header}#${item}`, json[item]);
                rowData.push(jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString);
            } else if(jsonString != undefined && jsonString[0] == "[") {    
                if(jsonString != undefined && jsonString[1] == '{') {   // 匹配 ：{data: {key: [{}]}}
                    // for(let i in json[item]) {
                    //     subTable += "\n" + convertToVTable(undefined, json[item][i]);
                    // }
                    subTable += "\n" + convertArrayToTable(`${header}#${item}`, json[item]);
                    rowData.push(jsonString.length > remainLen ? jsonString.substring(0, remainLen) + "..." : jsonString);
                } else {    // 匹配 ：{data: {key: value}}
                    rowData.push(jsonString);
                }
                
            } else {

                if(typeof json[item] == 'string') {
                    rowData.push(StringUtil.wordWrap(json[item], maxColumnSize));
                }  else {
                    rowData.push(json[item]);
                }
                
            }
        }
    }
    res.push(rowData);

    if(parent && !sub) {
       return res.toString();
    } else if(sub && !parent) {
        return subTable;
    }
    return res.toString() + subTable;
}

module.exports = convertToVTable;