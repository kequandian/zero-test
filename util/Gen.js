var shell = require("shelljs");
var Swagger = require('./Swagger');
var fs = require('fs');
var fileMap = require('../conf/file_map.config');
var Reader = require('./Reader');
var DateUtil = require('../cli-tools/api-gen/util/dateUtil');

/**
 * api-gen 调用
 */
let Gen = {
    genFile : fileMap.gen,
    /**
     * 生成api请求参数，默认通过swagger.json获取字段信息；
     * 若指定了table,则通过table获取
     * @param {string} api api
     * @param {string} table table
     * @param {string} params gen参数列表
     */
    genarator(api, method, table, swagger, params) {
        if(table) {
            shell.exec(`(cd cli-tools/api-gen && node index.js -t ${table} ${params} > ../../${this.genFile})`);
        } else if(swagger) {
            Swagger.writeFields("/" + api, method, `${fileMap.params}`);
            shell.exec(`(cd cli-tools/api-gen && node index.js -f ../../${fileMap.params} ${params} > ../../${this.genFile})`);
        } else {
            // this.writeFilterToJson(params);
            params = Reader.parseJson(params);
            for(let key in params) {
                if(params[key] == "$CURRENT_DATE") {
                    params[key] = DateUtil.getNow();
                }
            }
            fs.writeFileSync(this.genFile, JSON.stringify(params), "utf-8");
        }
    },
    writeFilterToJson(filter) {
        let arr = filter.substring(1, filter.length - 1).split(",");
        let json = {};
        for(let item in arr) {
            let map = arr[item].split(":");
            json[map[0]] = map[1];
        }
        fs.writeFileSync(this.genFile, JSON.stringify(json), "utf-8");
    }
}

module.exports = Gen;