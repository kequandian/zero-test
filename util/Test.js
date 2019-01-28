var shell = require("shelljs");
var fs = require('fs');
var server = require(`${process.cwd()}/test-env/server.config`);
var loginInfo = require(`${process.cwd()}/test-env/login.config`);
var fileMap = require(`../static/file_map.config`);
var Reader = require('./Reader');
var root = require('../static/root.config');
var Path = require(`./Path`);

/**
 * env-test 脚本调用
 */
let Test = {
    run(api, method, body) {
        if(body) {
            //demo: run '{\"url\":\"testbody\"}'
            body = `'${body}'`;
            body = body.replace(new RegExp(" ", "g"), "nbsp");
        }
        
        shell.cd(`${root}/cli-tools/env-test`);
        if (shell.exec(`bash ./test ${method} ${server.host}${api} run ${body} > ${root}/${fileMap.response}`).code !== 0) {
            console.log('error while exec env-test/test');
            console.log(`command : cd ${root}/cli-tools/env-test && ls && bash ./test ${method} ${server.host}${api} run ${body} > ${root}/${fileMap.response}`);
            shell.cd(originPath);
            Path.cd();
            shell.exit(1);
        }
        Path.cd();
    },
    //$(./post /oauth/login "{\"account\":\"$user\",\"password\":\"$passw\"}")
    login(api, account, password) {
        if(loginInfo) {
            let login_api;
            login_api = loginInfo[api];
            if(!login_api) {
                //console.log("login <endpoint> <account> <password>");
                console.log(`cannot find endpoint ${api}`);
                let loginError = {
                    code : 404,
                    message : `cannot find endpoint ${api}`
                }
                fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify(loginError), 'UTF-8');
                shell.exit(1);
            }
            
            shell.cd(`${root}/cli-tools/env-test`);
            body = `'{"account":"${account}","username":"${account}","password":"${password}"}'`;
            if (shell.exec(`bash ./test post ${server.host}${login_api} run ${body} > ${root}/${fileMap.response}`).code !== 0) {
                console.log('error while exec env-test/test');
                console.log(`command : (cd ${root}//cli-tools/env-test && bash ./test post ${server.host}${login_api} run ${body} > ${root}/${fileMap.response})`);
                shell.exit(1);
            }
            let loginRes = fs.readFileSync(`${root}/${fileMap.response}`, "UTF-8");
            loginRes = Reader.parseJson(loginRes);
            if(loginRes && (loginRes.status_code == 0 || loginRes.code == 200)) {
                if(api.substring(0, 4) == "rest") {
                    fs.writeFileSync(`${root}/cli-tools/env-test/app.token`, `${loginRes.data.access_token}`);
                } else  {
                    fs.writeFileSync(`${root}/cli-tools/env-test/app.token`, `${loginRes.data.accessToken}`);
                }
                
            } else {
                try {
                    console.log(`login failure, message=${loginRes && JSON.stringify(loginRes)}`);
                } catch (err) {
                    // nothing to do
                }
            }
            Path.cd();
        } 
    }
}
module.exports = Test;