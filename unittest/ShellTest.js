'use strict';

var shell = require("shelljs");

var dir = `${process.cwd()}`
if(dir.endsWith('unittest')){
    console.log("should be run outside unittest !")
    return
}
shell.exec(`sh ${dir}/unittest/test-shell.sh hi shell!`);

// var exec = require('child_process').exec;
// var myscript = exec(`sh ${process.cwd()}/get hi.bat`);

// myscript.stdout.on('data',function(data){
//     console.log(data); 
// });

// myscript.stderr.on('data',function(data){
//     console.log('msg=', data); 
// });
