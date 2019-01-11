let fs = require('fs');
let fileMap = require(`../static/file_map.config`);
let shell = require('shelljs');
let Reader = require('./Reader');
let root = require('../static/root.config');

let Save = {
    savaField : "#SAVE_VALUE",
    saveValue(field) {
        if(field) {
            if(!fs.existsSync(`${root}/${fileMap.save}`)) {
                shell.exec(`echo {} > ${root}/${fileMap.save}`);
            }
            let api = Reader.readJson(`${root}/${fileMap.save}`);
            let res = Reader.readJson(`${root}/${fileMap.response}`);
            let findField = false;
            for(let item in res) {
                if(item == field) {
                    api[this.savaField] = res[item];
                    findField = true;
                    break;
                }
            }
            if(!findField) {
                for(let item in res) {
                    if(res[item] instanceof Object && !Array.isArray(res[item])) {
                        for(let innerItem in res[item]) {
                            if(innerItem == field) {
                                api[this.savaField] = res[item][innerItem];
                                findField = true;
                                break;
                            }
                        }
                    }
                }
            }
            if(!findField) {
                console.log(`警告 : 字段 ${field} 未找到`);
            } else {
                fs.writeFileSync(`${root}/${fileMap.save}`, JSON.stringify(api), 'utf-8');
            } 
        }
    }
}

module.exports = Save;