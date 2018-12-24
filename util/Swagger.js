var shell = require("shelljs");
var fs = require('fs');

/**
 * swagger.json 解析
 */
let Swagger = {

    swagger : undefined,
    /**
     * 获取swagger.json中指定api的字段信息，并写入指定文件
     * @param {string} api 
     * @param {string} method 
     * @param {string} file 
     */
    writeFields(api, method, file) {
        let apiInfo = this.getSwagger()[`${api}`]; 
        if (apiInfo != undefined) {
            let methodInfo = apiInfo[method.toLowerCase()];
            if(methodInfo) {
                if (Array.isArray(methodInfo.fields)) {
                    apiInfo.fields = methodInfo.fields[0];
                }
                fs.writeFileSync(file, JSON.stringify(methodInfo.fields));
                // shell.exec(`node ./cli-tools/pretty-json/index.js -f temp/params.json -c -s`);
            } else {
                console.log(`swagger.json error: ${method} ${api}  fields is ${JSON.stringify(apiInfo[method])}`);
                shell.exit(1);
            }

        } else {
            console.log(`${api}不存在或swagger.json需更新, 也可通过--table指定数据库使用`);
            shell.exit(1);
        }
    },

    /**
     * 获取swagger josn对象
     */
    getSwagger() {
        if(!this.swagger) {
            try {
                this.swagger = fs.readFileSync('./swagger/swagger.json', 'utf-8');
            } catch(err) {
                // nothing to do
            } finally {
                this.swagger = undefined ? {} : this.swagger;
            }
        } 
        return this.swagger;
    }

}

module.exports = Swagger;