const shell = require('shelljs');
const ora = require('ora');
const fs = require('fs');
const clone = require('./clone');

module.exports = function () {
  const spinner = ora('').start();
  const path = `${__dirname}/../template/layout`;
  if (!fs.existsSync(`${path}/package.json`)) {
    clone('kequandian/zero-layout', `${__dirname}/../template/layout`).then( () => {
      list(path, spinner);
    })
  }else{
    list(path, spinner);
  }
}

function list(path, spinner) {
  spinner.info('当前可用组件：');
  spinner.stopAndPersist({ symbol: '>>' });

  const templateOutPath = require(`${path}/package.json`).main;

  shell.exec(`cat ${path}/${templateOutPath} | grep '.default;' | grep -E -o '^(exports.)[a-zA-Z]+' | sed 's/exports.//' `);
}