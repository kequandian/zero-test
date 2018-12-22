
const path = require('path');
const shell = require('shelljs');

module.exports = function (dirPath, keyword, value) {
  dirPath = path.normalize(dirPath).replace(/\\/g, '/');
  shell.exec(`find ${dirPath} -path "*/node_modules/*" -prune -o -type f -print | xargs sed -i 's/${keyword}/${value}/g' `);
  // shell.exec(`find ${dirPath} -path "*/node_modules/*" -prune -o -type f -print | xargs sed 's/${keyword}/${value}/g' `);
}