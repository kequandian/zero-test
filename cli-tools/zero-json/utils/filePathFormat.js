
const cwd = process.cwd();
const path = require('path');

module.exports = function filePathFormat(filePath){
  if (path.extname(filePath) === '') {
    filePath += '.js'
  }
  return path.resolve(cwd,filePath);
}