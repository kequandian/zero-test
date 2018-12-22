const fs = require('fs');
const path=require('path');  /*nodejs自带的模块*/

// TC - test case
const [ nodePath, scriptPath, swaggerJsonFile, API, Method, Trace ] = process.argv;

//console.log("swaggerJsonFile="+swaggerJsonFile+" API="+API + " Method="+Method + " Trace="+Trace)
var api = API;
var method = Method;
var trace = Trace;
if(trace === undefined){
   trace = false;
}else if(trace=="trace"){
   trace = true;
}else{
   trace = false;
}

// fix API
if(API && API.substr(0,1)!='/'){
   api = "/" + API;
}

if(Method){
   // 转换为小写
   method = Method.toLowerCase()
}

//未输入参数的话打印脚本用法
if(! swaggerJsonFile){
   //get filename from path
   var scriptName = path.basename(scriptPath);
   console.log( "Usage: node " + scriptName + " <swagger.json>")
   return
}

let file = swaggerJsonFile;

var strResult = "";

var result=JSON.parse(fs.readFileSync(file));

//获取路径下的paths
let paths = result.paths;
let definitions = result.definitions;


//获取路径下的所有的key和value
if(api){
   if(paths[api]){
      onEachAPI(api, method, trace);
   }else{
      console.log("fatal: invalid API " + api);
   }
   
}else{
    for(let parentKey of Object.keys(paths)){
        //onEachAPI(parentKey)
        onEachAPI(parentKey, undefined, false);
    }
}

// 处理每一个API
// trace: 是否打印 Body
function onEachAPI(api, method, trace){
    //console.log("-------" + api + " "  + method)
    let apiObject = paths[api];
    
    if(method){
	// 判断是否为 CRUD API
	var crud = checkCRUD(api, method);
	
        onEachAPIMethod(api, method, crud, apiObject, trace);
        
    }else{
        for(let _method of Object.keys(apiObject)){
            //console.log("++++++"+ _method);
			
	    // check crud
            var crud = checkCRUD(api, _method);
			
            onEachAPIMethod(api, _method, crud, apiObject, trace);
        }
    }
}

// 处理每一个API方法
// crud : 是否CRUD类型API
// trace: 是否打印 Body
function onEachAPIMethod(api, method, crud, apiObject, trace){
    //console.log(api + " " + method + " " + crud + " " + trace)
    if(apiObject[method]){
        
        if(method == "get"){
           console.log(method.toUpperCase() + " "  + api + (crud?"  CRUD":"") );
		   //console.log(method.toUpperCase() + " "  + api);
		   
        }else if(method == "delete"){
           console.log(method.toUpperCase() + " "  + api + (crud?"  CRUD":""));
		   //console.log(method.toUpperCase() + " "  + api);
           
        }else if(method == "post" || method == "put"){
            
			let methodObject = apiObject[method];
			var bodyReference = getSchemaReference(methodObject)
		    if(trace){
			   let methodBody = getMethodBody(api, method, crud, bodyReference)
			   
			   debug_trace(methodBody)
			   
			}else{
			   let TIP = bodyReference == "Tip";
			
			   console.log(method.toUpperCase() + " "  + api + (crud?"  CRUD":"") + (TIP?"  TIP":"  "+bodyReference));
			   //console.log(method.toUpperCase() + " "  + api);
			}
            
        }else{
            
        }
    }
}


// 获取API方法Body
// crud   : 是否为CRUD类型API
// namekey: Body参数名
function getMethodBody(api, method, crud, namekey){
    
    if(JSON.stringify(namekey) != '{}'){
        //modelValue = definitions[namekey]['properties'];
        //modelValue = JSON.stringify(modelValue);
        
        //转换JSON
        var myObject={};
        for(let propertiesKey of Object.keys(definitions[namekey]['properties'])){
            //console.log(definitions[namekey]['properties'][propertiesKey]['type'])
            let proObj=definitions[namekey]['properties'][propertiesKey];
            let inter=proObj['type']
            if(inter=='integer'){
                inter=0
            }
            
            myObject[propertiesKey]=inter;
        }

        //TODO, if method==post and api is type of CRUD
        // myObject remove id 
		if(crud){
		    if(method=='post'){
   			    delete myObject.id;
			}
			
			//if(method=='put' || method=='post'){
  			//	if(myObject['createTime']){
			//	   delete myObject.createTime;
			//	}
			//}
		}
        
        return myObject;
    }
}

// 获取Body参数名
function getSchemaReference(methodObject){
    var namekey={};
    //let prokey  = parentKey.substring(parentKey.lastIndexOf('/')+1, parentKey.length)

    let mod=methodObject.responses;
    //debug_trace(mod)
    if(mod){
        if(mod["200"]){
            let R200 = mod["200"];
            let schema = R200["schema"];
            if(schema){
               namekey=schema["$ref"].slice(14);
            }
        }else{
            console.log("fatal: not recongized response");
            debug_trace(mod);
        }
    }
	
	return namekey;
}

// 检查是否为CRUD方法
function checkCRUD(api, method){
    var crud = false;
	if(method == "post"){
		// check put API
		var putAPI = api + "/{id}";
		if(paths[putAPI]){
		   crud = true;
		}
	}else if(method == "put" || method == "delete"){
	   let key = "/{id}";
	   if(api.endsWith(key)){
		var postAPI = api.slice(0,api.length-key.length)
		if(paths[postAPI]){
	            crud = true;
	        }
	   }

	}else if(method == "get"){
	   let key = "/{id}";
	   if(api.endsWith(key)){
		   var postAPI = api.slice(0,api.length-key.length)
		   if(paths[postAPI]){
		      crud = true;
		   }
	   }else{
		   var putAPI = api + "/{id}";
		   if(paths[putAPI]){
		      crud = true;
		   }
	   }
	}
	return crud;
}

function debug_trace(obj){
  if(obj){
     console.log(JSON.stringify(obj));
  }
}


////////////////////////////////////////
// Deprecated
////////////////////////////////////////
function onEachAPI_V0(api) {
    let apiValue = paths[parentKey];
    let postValue = apiValue['post'];
    let putValue = apiValue['put'];
    
    if(postValue){
        onEachMethod(postValue);
    }
    if(putValue){
        onEachMethod(putValue);
    }
}

function onEachMethod_V0(methodValue){

    let namekey={};
    let prokey  = parentKey.substring(parentKey.lastIndexOf('/')+1, parentKey.length)
    
    let mod=methodValue.parameters[1];
    if(mod){
        if(mod.schema){
            //console.log(mod.schema.$ref.slice(14));
            namekey=mod.schema.$ref.slice(14);
        }
    }
    if(JSON.stringify(namekey) != '{}'){
        console.log('post'+' '+parentKey+' '+namekey+'_post'+'.json')
        if(namekey==Object.keys(definitions)){
            console.log('123')
        }
        for(let defkey of Object.keys(definitions)){
            if(namekey==defkey){
                
                modelValue = definitions[namekey]['properties'];
                //modelValue = JSON.stringify(modelValue);

                //console.log(JSON.stringify(modelValue))
                let newfilepath =  __dirname + '/Finaljson/'+namekey+'_post'+'.json';
                //新加
                var myObject={};

                for(let propertiesKey of Object.keys(definitions[namekey]['properties'])){
                    let proObj=definitions[namekey]['properties'][propertiesKey];
                    let inter=proObj['type']
                    if(inter=='integer'){
                        inter=0
                    }else if(inter=='number'){
					    inter=0
					}
                    myObject[propertiesKey]=inter;
                    
                }
                //console.log(JSON.stringify(myObject))
                    
                fs.writeFileSync(newfilepath,JSON.stringify(myObject,null,4));
            }

        }
    }
}


