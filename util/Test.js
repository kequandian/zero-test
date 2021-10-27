var shell = require("shelljs");
var fs = require('fs');
var path = require('path')
var server = require(`../config/server.config`);
var fileMap = require(`../config/file_map.config`);
var Reader = require('./Reader');
var root = path.dirname(__dirname)

/**
 * env-test 脚本调用
 */
let Test = {
    run(api, method, token, body) {
        if(body) {
            //demo: run '{\"url\":\"testbody\"}'
            body = `'${body}'`;
            body = body.replace(new RegExp(" ", "g"), "nbsp");
        }else if(body==undefined){
            body=''
        }
        if(token===undefined){
            token=''
        }
        
        let serverEndpoint = server.endpoint
        endpointapi=(api.startsWith("http://") || api.startsWith("https://")) ? api : serverEndpoint.concat(api)

        console.log(`sh ./test ${method} ${endpointapi} ${token} run ${body} > ${root}/${fileMap.response}`)
        shell.cd(`${root}/cli-tools/env-test`);
        if (shell.exec(`sh ./test ${method} ${endpointapi} ${token} run ${body} > ${root}/${fileMap.response}`).code !== 0) {
            console.log('error while exec env-test/test');
            shell.cd(__dirname);
            shell.exit(1);
        }

        shell.cd(path.dirname(__dirname));
    },

    //$(./post /oauth/login "{\"account\":\"$user\",\"password\":\"$passw\"}")
    login(api, account, password) {
        if(server) {
            let login_api;
            login_api = server[api];
            if(!login_api) {
                //console.log("login <endpoint> <account> <password>");
                console.log(`cannot find endpoint ${api}`);
                let loginError = {
                    code : 404,
                    message : `cannot find endpoint ${api}`
                }
                //fs.writeFileSync(`${root}/${fileMap.response}`, JSON.stringify(loginError), 'UTF-8');
                fs.writeFileSync(`./${fileMap.response}`, JSON.stringify(loginError), 'UTF-8');
                shell.exit(1);
            }

            //shell.cd(`${root}/cli-tools/env-test`);
            shell.cd(`${root}/cli-tools/env-test`);
            body = `'{"account":"${account}","password":"${password}"}'`;

            let endpoint=`${server.endpoint}`.replace(/\/$/, "")
            let loginAPI = `${login_api}`.replace(/^\//, "")
            var url = `${endpoint}/${loginAPI}`
            
            //console.log("sh ./test post", `${url}`, "run", `${body}`, `${root}/${fileMap.response}`)
            if (shell.exec(`sh ./test post ${url} run ${body} > ${root}/${fileMap.response}`).code !== 0) {
            //if (shell.exec(`sh ./test post ${url} run ${body} > ./${fileMap.response}`).code !== 0) {                
                console.log('error while exec env-test/test');
                console.log(`command : (cd .//cli-tools/env-test && sh ./test post ${url} run ${body} > ${root}/${fileMap.response})`);
                shell.exit(1);
            }

            let loginRes = fs.readFileSync(`${root}/${fileMap.response}`, "UTF-8");
            loginRes = Reader.parseJson(loginRes);
            //console.log('loginRes=', loginRes)
            if(loginRes && (loginRes.status_code == 0 || loginRes.code == 200)) {
                if(api.substring(0, 4) == "rest") {
                    //fs.writeFileSync(`${root}/cli-tools/env-test/app.token`, `${loginRes.data.access_token}`);
                    fs.writeFileSync(`./app.token`, `${loginRes.data.access_token}`);
                } else  {
                    //fs.writeFileSync(`${root}/cli-tools/env-test/app.token`, `${loginRes.data.accessToken}`);
                    fs.writeFileSync(`./app.token`, `${loginRes.data.accessToken}`);
                }
                
            } else {
                try {
                    console.log(`login failure, message=${loginRes && JSON.stringify(loginRes)}`);
                } catch (err) {
                    // nothing to do
                }
            }
            shell.cd(path.dirname(__dirname))
        } 
    }
}
module.exports = Test;