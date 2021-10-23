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

    readEachLine(line){
        if (line.startsWith("@")){
            this.parseVariable(line)
        }else if(line.startsWith("#") || line.startsWith("//")){
            this.parseCommentline(line)
        }else if(line.startsWith("GET ") || line.startsWith("get ") || line.startsWith("POST ") || line.startsWith("post ") || line.startsWith("PUT ") || line.startsWith("put ") || line.startsWith("DELETE ") || line.startsWith("delete ")){
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

        if(this.currentTest()['status']==undefined){
            return ''
        }
        return this.currentTest()['status'];
    },

    // vscoe rest client plugin .http 
    // parse each test case to curl 
    parseHttpContent(fileContent){
        this.TESTS = {}
        this.tVARS = {}

        if(!(fileContent==undefined || fileContent == '')){
            lines = fileContent.split("\n")
            for(let i in lines) {
                let line = lines[i]==undefined? '' : lines[i].trim()
                console.log(i, " ", line)
                this.readEachLine(line)
            }
        }

        // remove current TEST
        if(this.TESTS['current']!=undefined){
           delete this.TESTS['current']
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
        return this.TESTS['current']===undefined?{} : this.TESTS['current']
    },
    deleteCurrentTest(){
        if(this.TESTS['current']!=undefined){
            let key  =  this.TESTS['current']['key']
            if(key!=undefined){
                delete this.TESTS[key]
            }
        }
    },
    currentTestStatus(){
        return this.TESTS['current']===undefined? undefined : this.TESTS['current']['status']
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
        if(this.currentTest()['body']==undefined){
            this.currentTest()['body']=''
        }
        this.currentTest()['body'] += json_line
    },

    // handle @ variables
    parseVariable(line){
        var ss = line.split("=")
        let key = ss[0].replace('@','').trim()
        let value = ss[1].trim()

        this.tVARS[key]=value
    },
    testMethod(){
        if(this.currentTestStatus()==='closed'){
           return this.currentTest()['method']    
        }
        throw new Error('current test status is not \'closed\'') 
     },
    testRequest(){
       if(this.currentTestStatus()==='closed'){
          return this.currentTest()['request']    
       }
       throw new Error('current test status is not \'closed\'') 
    },
    testBody(){
        if(this.currentTestStatus()==='closed'){
           return this.currentTest()['body']
        }
        throw new Error('current test status is not \'closed\'') 
    },

    // create a new item, which start with "### "
    parseTestTitle(line){
        let key = line

        // close last current
        if(this.currentTest()!=undefined)
        {
            // mean ## again, just delete last test
            if(this.currentTestStatus()==='titled'){
               // delete current Test
               this.deleteCurrentTest()
            }else{
               this.currentTest()['status']='closed'
            }
        }

        // 
        this.TESTS[key] = {}
        this.TESTS[key]['status'] = 'titled'

        // set current key 
        this.TESTS['current']= this.TESTS[key]
        this.TESTS['current']['key'] = key
    },
    parseCommentline(line){
        this.parseTestTitle(line)  // title the test first
        this.parseEmptyLine(line)  // the same as empty line
    },

    // handle http request
    parseHttpRequest(line){
        let request = line

        // remove HTTP
        request = request.lastIndexOf(" HTTP")>0? request.substring(0, request.lastIndexOf(" HTTP")) : request
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

        // remote method 
        request = request.substring(CURRENT_TEST['method'].length).trim()

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
        }else if(this.isTestRequestingBody()){
            // collect body lines
            this.collectBodyLine(line)
        }
    }
}

module.exports = Parser;