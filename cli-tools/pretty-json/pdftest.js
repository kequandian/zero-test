let pdf = require('pdfkit');
let fs = require('fs');
let text = fs.readFileSync('./logs/2018-12-06.txt', 'utf-8');
console.log(text);
let outter = new pdf();
outter.pipe(fs.createWriteStream('test.pdf'));
outter.text(text, 0, 0);
outter.end();