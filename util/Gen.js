var shell = require("shelljs");
var Swagger = require('./Swagger');

/**
 * api-gen 调用
 */
let Gen = {
    /**
     * 生成api请求参数，默认通过swagger.json获取字段信息；
     * 若指定了table,则通过table获取
     * @param {string} api api
     * @param {string} table table
     * @param {string} params gen参数列表
     */
    genarator(api, method,table, params) {
        if(table) {
            console.log(`(cd cli-tools/api-gen && node index.js -t ${table} ${params} > ../../gen.json)`);
            shell.exec(`(cd cli-tools/api-gen && node index.js -t ${table} ${params} > ../../gen.json)`);
        } else {
            Swagger.writeFields("/" + api, method, './temp/params.json');
            shell.exec(`(cd cli-tools/api-gen && node index.js -f ../../temp/params.json ${params} > ../../gen.json)`);
        }
    }
}

module.exports = Gen;