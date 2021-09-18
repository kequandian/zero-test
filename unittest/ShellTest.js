'use strict';

var shell = require("shelljs");
shell.exec(`sh ${process.cwd()}/unit-test/test-shell.sh hi shell!`);

// var exec = require('child_process').exec;
// var myscript = exec(`sh ${process.cwd()}/get hi.bat`);

// myscript.stdout.on('data',function(data){
//     console.log(data); 
// });

// myscript.stderr.on('data',function(data){
//     console.log('msg=', data); 
// });