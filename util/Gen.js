var shell = require("shelljs");
var Swagger = require('./Swagger');
var fs = require('fs');
var fileMap = require(`../static/file_map.config`);
var Reader = require('./Reader');
var DateUtil = require(`../cli-tools/api-gen/util/dateUtil`);
var StringUtil = require(`../cli-tools/api-gen/util/StringUtil`);
var root = require('../static/root.config')

/**
 * api-gen 调用
 */
let Gen = {
    genFile : `${root}/${fileMap.gen}`,
    /**
     * 生成api请求参数，默认通过swagger.json获取字段信息；
     * 若指定了table,则通过table获取
     * @param {string} api api
     * @param {string} table table
     * @param {string} params gen参数列表
     */
    genarator(api, method, table, swagger, params) {
        if(table) {
            
            shell.exec(`(cd ${root}/cli-tools/api-gen && node index.js -t ${table} ${params} > ${this.genFile})`);
            params = Reader.parseJson(fs.readFileSync(this.genFile, "UTF-8"));
        } else if(swagger) {
            Swagger.writeFields("/" + api, method, `${root}/${fileMap.params}`);
            shell.exec(`(cd ${root}/cli-tools/api-gen && node index.js -f ${root}/${fileMap.params} ${params} > ${this.genFile})`);
            params = Reader.parseJson(fs.readFileSync(this.genFile, "UTF-8"));
        } else {
            //this.writeFilterToJson(params);
            params = Reader.parseJson(params ? params : "{}");
        }
        //params = Reader.parseJson(params);
        params = StringUtil.replacePlaceholder(JSON.stringify(params));
        fs.writeFileSync(this.genFile, params, "utf-8");
    },
    writeFilterToJson(filter) {
        let arr = filter.substring(1, filter.length - 1).split(",");
        let json = {};
        for(let item in arr) {
            let map = arr[item].split(":");
            json[map[0]] = map[1];
        }
        fs.writeFileSync(this.genFile, JSON.stringify(json), "utf-8");
    },
    /**
     * 替换json对象中的占位符, 最多支持2层
     * $2D  表示现在时间2天前
     * $2DA 表示现在时间2天前 00:00:00 
     * $2DP 表示现在时间2天前 23.59.59
     * $CUR currnet_time
     * @param {json} json 
     */
    replacePlaceholder(json) {
        for(let key in params) {
            if(params[key] == "$CUR") {
                params[key] = DateUtil.getNow();
            } else if(/\$[0-9]+DA/.test(params[key])) {
                let day = params[key].substring(1, params[key].length - 2);
                params[key] = DateUtil.getDA(day);
            } else if(/\$[0-9]+DP/.test(params[key])) {
                let day = params[key].substring(1, params[key].length - 2);
                params[key] = DateUtil.getDP(day);
            }
        }
    }
}
module.exports = Gen;

