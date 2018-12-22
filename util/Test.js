var shell = require("shelljs");
var fs = require('fs');
var server = require('../server.config');

/**
 * env-test 脚本调用
 */
let Test = {
    run(api, method, body) {
        if(body) {
            //demo: run '{\"url\":\"testbody\"}'
            body = `'${body}'`;
        }
        console.log(`bash ./test ${method} ${server.host}${api} run ${body}`);
        if (shell.exec(`(cd ./cli-tools/env-test && bash ./test ${method} ${server.host}${api} run ${body} > ../../temp/response.json)`).code !== 0) {
            console.log('error while exec env-test/test');
            console.log(`command : (cd ./cli-tools/env-test && ls && bash ./test ${method} ${server.host}${api} run ${body} > temp/response.json)`);
            shell.exit(1);
        }
    },
    //$(./post /oauth/login "{\"account\":\"$user\",\"password\":\"$passw\"}")
    login(api, account, password) {
        let loginInfo = server.login_info;
        if(loginInfo) {
            let login_api;
            login_api = loginInfo[api];
            if(!login_api) {
                console.log("login <endpoint> <account> <password>");
                shell.exit(1);
            }
            // if(api.substring(0, 3) == "api") {
            //     login_api = loginInfo.api;
            // } else if(api.substring(0, 4) == "rest") {
            //     login_api = loginInfo.rest;
            // } else {
            //     console.log("login <api|rest|.> <account> <password>");
            //     shell.exit(1);
            // }
            body = `'{"account":"${account}","username":"${account}","password":"${password}"}'`;
            console.log(`command:  (cd ./cli-tools/env-test && bash ./test post ${server.host}${login_api} run ${body} > ../../temp/response.json)`);
            if (shell.exec(`(cd ./cli-tools/env-test && bash ./test post ${server.host}${login_api} run ${body} > ../../temp/response.json)`).code !== 0) {
                console.log('error while exec env-test/test');
                console.log(`command : (cd ./cli-tools/env-test && ls && bash ./test post ${server.host}${login_api} run ${body} > temp/response.json)`);
                shell.exit(1);
            }
            let loginRes = fs.readFileSync('./temp/response.json', "UTF-8");
            try {
                loginRes = JSON.parse(loginRes);
            } catch(err) {
                // do nothing
            }
            if(loginRes && (loginRes.status_code == 0 || loginRes.code == 200)) {
                if(api.substring(0, 4) == "rest") {
                    fs.writeFileSync('./cli-tools/env-test/app.token', `${loginRes.data.access_token}`);
                } else  {
                    fs.writeFileSync('./cli-tools/env-test/app.token', `${loginRes.data.accessToken}`);
                }
                
            } else {
                try {
                    console.log(`login failure, message=${loginRes && JSON.stringify(loginRes)}`);
                } catch (err) {
                    console.log(`login failure, message=${loginRes && loginRes}`);
                }
                
                
            }
            
        } 

    }
}
module.exports = Test;