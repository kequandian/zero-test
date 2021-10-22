const Parser = {

    TESTS: {},      // 保存测试用例
    VARS: {},       //变量

    //TESTS_SORT = [],  // 排序

    readFileContent(filePath){

    },

    // vscoe rest client plugin .http 
    // parse each test case to curl 
    parseHttpContent(fileContent){
        lines = fileContent.split("\n")

        for(let i in lines) {
            let line = lines[i]==undefined? '' : lines[i].trim()

            if (line.startsWith("@")){
                parseVariable(line)
            }else if(line.startsWith("### ")){
                parseTestTitle(line)
                // for sort
                //TESTS_SORT.push(line)
            }else if(line.startsWith("#") || line.startsWith("//")){
                // skip comment
            }else if(line.startsWith("GET ") || line.startsWith("POST ") || line.startsWith("PUT ")||line.startsWith("DELETE ")){
                parseHttpRequest(line)
            }else if(line.startsWith("{")){
                parseBodyBegin(line)
                // until empty line
            }else if(line.startsWith("&") || line.startsWith("?")){
                parseQueryParam(line)
            }else if(line == '') {
                parseEmptyLine(line)
            }else{
                parseAnyline(line)
            }
        }
    },

    getTestCurl(title){
        var test = TESTS[title]
        var curl 

        return curl
    },

    // 获取当前测试
    currentTest(){
        return this.TESTS['current']
    },
    isCurrentTestGet(){
        return this.TESTS['current']['method'] == 'GET'
    },
    isCurrentTestPost(){
        return this.TESTS['current']['method'] == 'POST'
    },
    isCurrentTestPut(){
        return this.TESTS['current']['method'] == 'PUT'
    },
    isTestClosed(){
        return this.TESTS['current']['status'] == 'closed'
    },
    closeTest(){
        this.TESTS['current']['status'] = 'closed'
    },
    isTestExpectingHeader(){
        return this.TESTS['current']['status'] == 'header_expecting'   // meet empty line
    },
    // body area
    isTestExpectingBody(){
        return this.TESTS['current']['status'] == 'body_expecting'   // meet empty line
    },
    expectBody(){
        this.TESTS['current']['status'] = 'body_expecting'
    },
    isTestRequestingBody(){
        return this.TESTS['current']['status'] == 'body_requesting'
    },
    requestBody(){
        this.TESTS['current']['status'] = 'body_requesting'
    },
    collectBodyLine(json_line){
        this.TESTS['current']['body'] += json_line
    },

    // handle @ variables
    parseVariable(line){
        var ss = line.split("=")
        let key = ss[0].replace('@','').trim()
        let value = ss[1].trim()

        VARS[key]=value
    }, 

    parseTestTitle(line){
        let key = line

        // create a new item
        this.TESTS[key] = {}
        this.TESTS[key]['key'] = key

        // set current key 
        this.TESTS['current']=TESTS[key]
    },

    // handle http request
    parseHttpRequest(line){
        let request = line
        // remove HTTP
        request = request.substring(0, request.lastIndexOf(" HTTP"))
        // removed HTTP

        let CURRENT_TEST = currentTest()
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
        let value = VARS[VAR]
        request = request.replace("{{"+VAR+"}}", value)
        CURRENT_TEST['request']=request
    },

    // handle body begin "{""
    parseBodyBegin(line){
        beginBody()
        collectBodyLine(line)
    }, 

    parseHttpHeader(line){
        // TODO, do not handle header
    },

    parseQueryParam(line){

    },

    // 遇空行结束
    parseEmptyLine(line){
        if(isCurrentTestGet()){
            // close Test
            this.closeTest()
        }else if(isCurrentTestPost() || isCurrentTestPut()){
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
        if(isTestExpectingHeader()){
            // TODO, temp skip header
        }else if(this.isTestExpectingBody()){
            // collect body lines
            collectBodyLine(line)
        }
    }
}

module.exports = Parser;