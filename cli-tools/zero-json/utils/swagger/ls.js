
const fs = require('fs');
const fsExtra = require('fs-extra');
const format = require('./format');
const shell = require('shelljs');

module.exports = function ls(filter) {
  const path = `${__dirname}/../../swagger/format.json`;
  if (!fs.existsSync(path)) {
    format().then(() => {
      list(path, filter);
    })
  } else {
    list(path, filter);
  }
}

function list(path, filter = '') {
  fsExtra.readJSON(path).then((jsonData) => {
    const lsData = [];
    Object.keys(jsonData).forEach(API => {
      const APIItem = jsonData[API];
      const methodList = ['get', 'post', 'put', 'delete'];
      methodList.forEach(method => {
        if (APIItem[method]) {
          lsData.push(`${method} ${API} ${APIItem[method].summary}`);
        }
      });
    });
    fsExtra.outputFile(`${path}/../ls`, lsData.join('\n'))
    .then( () => {
      shell.exec(`cat ${path}/../ls | grep '${filter}' `);
    } )
  });
}