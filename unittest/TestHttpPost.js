
var Http = require('../util/Http');
var path = require("path");
var root = path.dirname(__dirname)
var Reader = require('../util/Reader');

var api='http://192.168.3.189:8080/api/crud/option/options'
var file=`${root}/temp/gen.json`
console.log('file=', file)

if(true){
Http.post(api, file);
}else{

let body = Reader.readJson(file);
body = JSON.stringify(body);
body.replace(new RegExp('"', 'gm'), '\\"');
console.log(body)

}
