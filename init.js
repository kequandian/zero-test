let fs = require('fs');
let root=__dirname
let path = `module.exports="${process.cwd()}"`;
path = path.replace(new RegExp(/\\/, "g"), "/");

//console.log('root=',root,'path=',path)
//fs.writeFileSync(root, path, 'UTF-8') ;
