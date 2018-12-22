
const ora = require('ora');
const clone = require('../clone');
const fs = require('fs');
const cwd = process.cwd();
const path = require('path');
const templateReplace = require('../../utils/templateReplace');
const confirm = require('../../utils/confirm');

module.exports = function (projectName, dirPath, direct) {
  const spinner = ora(`初始化后台管理项目： ${projectName}`).start();
  dirPath = path.resolve(cwd, `${dirPath}/${projectName}`);
  confirm(
    fs.existsSync(dirPath),
    function () {
      clone('kequandian/template-management', dirPath)
        .then((path) => {
          if (path) {
            spinner.info('替换模板关键字');
            templateReplace(path, 'ZERO_projectName', projectName);

            spinner.succeed(`后台项目 ${projectName} 初始化成功`);
          }
          process.exit();
        });
    },
    {
      message: '目录已存在，是否覆盖？',
      direct: direct,
    }
  );
}