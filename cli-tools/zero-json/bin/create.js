const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');

const filePathFormat = require('../utils/filePathFormat');

module.exports = function (name, filePath = name) {
  filePath = filePathFormat(filePath);

  const spinner = ora(`新增基础配置文件 ${filePath}`).start();
  const extname = path.extname(filePath);
  return new Promise((res, rej) => {
    if (extname === '.js') {

      createFile(filePath).then(() => {
        spinner.succeed(`基础配置文件 ${filePath} 已生成`);
        res(filePath);
      }).catch((err) => {
        spinner.fail(err);
        rej();
      });
    } else {
      spinner.fail(`非法的文件扩展名。预期 .js 传入的却是 ${extname}`);
      rej();
    }
  });

}

function createFile(path) {
  const template = {
    layout: 'Grid',
    title: '基础配置文件',
    items: [],
  };
  const date = 'module.exports = ' + JSON.stringify(template, null, 2);
  return fs.outputFile(path, date);
}