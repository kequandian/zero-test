let fs = require('fs');
let root = require('./static/file_map.config').root;
let path = `module.exports="${process.cwd()}"`;
path = path.replace(new RegExp(/\\/, "g"), "/");

fs.writeFileSync(root, path, 'UTF-8') ;