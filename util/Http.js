var shell = require("shelljs");
var path = require("path");
var fs = require('fs');
var server = require(`../config/server.config`);
var fileMap = require(`../config/file_map.config`);
var Test = require('./Test');
var Reader = require('./Reader');
var Url = require(`./Url`);
var root = path.dirname(__dirname)

/**
 * 发送http请求 (使用zero-test工具)
 */
let Http = {
    /** api返回信息 */
    response_file : `${root}/${fileMap.response}`,
    /**
     * 根据列表api返回指定位置id, 只支持-1和0
     * @param {string} api api
     * @param {int} index 下标
     */
    getId(api, index, token) {
        Test.run(api, 'GET', token);

        let response = Reader.readJson(this.response_file);
        if (response.code != 200 && response.status_code != 0) {
            // console.log(`${api}执行错误:\n${JSON.stringify(response)}`);
            return;
        }
        let records = response.data.records;
        index = index == -1 ? records.length - 1 : 0;
        let id = records[index].id;
        api = `${api}/${id}`;
        return api;
    },
    /**
     * Post请求，file为body文件位置
     * @param {string} api 
     * @param {int} index 
     */
    post(api, file, token) {
        // console.log(Reader.readText(file))
        let body = Reader.readJson(file);
        body = JSON.stringify(body);
        body.replace(new RegExp('"', 'gm'), '\\"');
        Test.run(api, 'post', token, Url.GBKToUnicode(body));
        return this.isSuccess();
    },
    /**
     * Put请求，file为body文件位置
     * @param {string} api 
     * @param {string} file 
     */
    put(api, file, token) {
        let body = Reader.readJson(file);
        body = JSON.stringify(body);
        body.replace(new RegExp('"', 'gm'), '\\"');
        Test.run(api,'put', token, Url.GBKToUnicode(body));
        return this.isSuccess();
    },
    /**
     * 先调用相应Get api获取指定索引数据id(头或尾)，然后进行PUT操作
     * 若不指定索引数据下标，则api需明确指定id, 如 : /api/test/1
     * @param {string} api 
     * @param {string} file 
     * @param {string} head 
     * @param {string} tail 
     */
    putAfterGetById(api, file, head, tail, token) {
        if(head || tail) {
            let index = head == undefined ? -1 : 0;
            api = Http.getId(api, index);
            console.log(`redirect api: PUT ${api}`);
            return Http.put(api, `${root}/temp/gen.json`, token);
        } else {
            return Http.put(api, `${root}/temp/gen.json`, token);
        }
    },
    /**
     * 先调用相应Get api获取指定索引数据id(头或尾)，然后进行相应操作(GET, POST, UPDATE, DELETE)
     * 若不指定索引数据下标，则api需明确指定id, 如 : /api/test/1
     * @param {string} api 
     * @param {string} method 
     * @param {int} head 
     * @param {int} tail 
     */
    actionAfterGetById(api, method, head, tail, token) {
        if (head || tail) {
            // head for index=0 and tail for -1
            let index = head ? 0 : tail ? -1 : 0
            api = Http.getId(api, index);
            console.log(`redirect api: ${method} ${api}`);
            Test.run(api, `${method}`, token);
        } else {
            Test.run(api, `${method}`, token);
        }
        return this.isSuccess();
    },

    isSuccess() {
        let response = Reader.readJson(this.response_file);
        if (response.code != 200 && response.status_code != 0) {
            if(response.message != undefined) {
                response.message = response.message.replace(new RegExp("\n",'g'), "");
                fs.writeFileSync(this.response_file, JSON.stringify(response), "utf-8");
            }
            return false;
        }
        return true;
    }

}
module.exports = Http;