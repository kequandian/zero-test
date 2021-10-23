// obj = {
//     name:"John",
//     sayHi: ()=>{
//         console.log("Hi " + name);
//     }

// }
// obj.sayHi();

const Parser = {

    TESTS: {},      // 保存测试用例

    
    // temp var
    tVARS: {},       // 用于记录.http变量

    forEachTest(){
        for(t in this.TESTS){
            
        }
    },

    // vscoe rest client plugin .http 
    // parse each test case to curl 
    parseHttpContent(fileContent){
        lines = fileContent.split("\n")
        for(let i in lines) {
            let line = lines[i]==undefined? '' : lines[i].trim()
            console.log(i, " ", line)

            if (line.startsWith("@")){
                this.parseVariable(line)
            }else if(line.startsWith("### ")){
                this.parseTestTitle(line)
                // for sort
                //TESTS_SORT.push(line)
            }else if(line.startsWith("#") || line.startsWith("//")){
                // skip comment
            }else if(line.startsWith("GET ") || line.startsWith("POST ") || line.startsWith("PUT ")||line.startsWith("DELETE ")){
                this.parseHttpRequest(line)
            }else if(line.startsWith("{")){
                this.parseBodyBegin(line)
                // until empty line
            }else if(line.startsWith("&") || line.startsWith("?")){
                this.parseQueryParam(line)
            }else if(line == '') {
                this.parseEmptyLine(line)
            }else{
                this.parseAnyline(line)
            }
        }
        return this.TESTS
    },

    getTestCurl(title){
        var test = TESTS[title]
        var curl 

        return curl
    },

    // 获取当前测试
    currentTest(){
        return this.TESTS['current']==undefined?{} : this.TESTS['current']
    },
    isCurrentTestGet(){
        return this.currentTest()['method'] == 'GET'
    },
    isCurrentTestPost(){
        return this.currentTest()['method'] == 'POST'
    },
    isCurrentTestPut(){
        return this.currentTest()['method'] == 'PUT'
    },
    isTestClosed(){
        return this.currentTest()['status'] == 'closed'
    },
    closeTest(){
        this.currentTest()['status'] = 'closed'
    },
    isTestExpectingHeader(){
        return this.currentTest()['status'] == 'header_expecting'   // meet empty line
    },
    // body area
    isTestExpectingBody(){
        return this.currentTest()['status'] == 'body_expecting'   // meet empty line
    },
    expectBody(){
        this.currentTest()['status'] = 'body_expecting'
    },
    isTestRequestingBody(){
        return this.currentTest()['status'] == 'body_requesting'
    },
    requestBody(){
        this.currentTest()['status'] = 'body_requesting'
    },
    collectBodyLine(json_line){
        this.currentTest()['body'] += json_line
    },

    // handle @ variables
    parseVariable(line){
        var ss = line.split("=")
        let key = ss[0].replace('@','').trim()
        let value = ss[1].trim()

        this.tVARS[key]=value
    }, 

    parseTestTitle(line){
        let key = line

        // create a new item
        this.TESTS[key] = {}
        this.TESTS[key]['key'] = key

        // set current key 
        this.TESTS['current']= this.TESTS[key]
    },

    // handle http request
    parseHttpRequest(line){
        let request = line
        // remove HTTP
        request = request.substring(0, request.lastIndexOf(" HTTP"))
        // removed HTTP

        let CURRENT_TEST = this.currentTest()
        if(request.startsWith("GET ")){
            CURRENT_TEST['method'] = 'GET'
        }else if(request.startsWith("POST ")){
            CURRENT_TEST['method'] = 'POST'
        }else if(request.startsWith("PUT ")){
            CURRENT_TEST['method'] = 'PUT'
        }else if(request.startsWith("DELETE ")){
            CURRENT_TEST['method'] = 'DELETE'
        }

        //handle {{}} VARS
        let VAR=request.substring(request.indexOf("{{")+"{{".length, request.indexOf("}}"))
        let value = this.tVARS[VAR]
        request = request.replace("{{"+VAR+"}}", value)
        CURRENT_TEST['request']=request
    },

    // handle body begin "{""
    parseBodyBegin(line){
        this.requestBody()
        this.collectBodyLine(line)
    }, 

    parseHttpHeader(line){
        // TODO, do not handle header
    },

    parseQueryParam(line){

    },

    // 遇空行结束
    parseEmptyLine(line){
        if(this.isCurrentTestGet()){
            // close Test
            this.closeTest()
        }else if(this.isCurrentTestPost() || this.isCurrentTestPut()){
            if(this.isTestExpectingHeader()){
                // again empty line, close the test
               this.expectBody()
            }else if(this.isTestExpectingBody()){
                this.requestBody()
            }else if(this.isTestRequestingBody()){
                this.closeTest()
            }
        }
    },

    // not empty
    parseAnyline(line){
        if(this.isTestExpectingHeader()){
            // TODO, temp skip header
        }else if(this.isTestExpectingBody()){
            // collect body lines
            collectBodyLine(line)
        }
    }
}

module.exports = Parser;