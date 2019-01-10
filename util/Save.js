let fs = require('fs');
let fileMap = require('../conf/file_map.config');
let shell = require('shelljs');
let Reader = require('./Reader');

let Save = {
    savaField : "#SAVE_VALUE",
    saveValue(field) {
        if(field) {
            if(!fs.existsSync(`${fileMap.save}`)) {
                shell.exec(`echo {} > ${fileMap.save}`);
            }
            let api = Reader.readJson(`${fileMap.save}`);
            let res = Reader.readJson(`${fileMap.response}`);
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
                fs.writeFileSync(`${fileMap.save}`, JSON.stringify(api), 'utf-8');
            } 
        }
    }
}

module.exports = Save;