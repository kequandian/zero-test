
const co = require('co');
const { confirm } = require('co-prompt');
const shell = require('shelljs');
const fs = require('fs-extra');

module.exports = function printAndConfirem(filePath, spinner, modifiedData, options) {
  const { direct } = options;

  spinner.info('修改之前的文件内容：');
  shell.exec(`cat ${filePath} `);
  spinner.stopAndPersist({ symbol: '' });
  spinner.stopAndPersist({ symbol: '' });
  spinner.info('修改之后的文件内容：');
  console.log(modifiedData);

  co(function* () {
    if (direct === false) {
      const ok = yield confirm('确定要修改吗？[y/n]');
      if (!ok) {
        process.exit();
        return false;
      }
    }
    fs.outputFile(filePath, modifiedData).then(() => {
      spinner.succeed(`配置文件 ${filePath} 的组件添加已完成`);
      process.exit();
    }).catch((err) => {
      spinner.fail(err);
      process.exit();
    })
  })
}