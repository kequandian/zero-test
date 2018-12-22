
const ora = require('ora');
const fileCheck = require('../../utils/fileCheck');
const printAndConfirm = require('../../utils/printAndConfirm');

module.exports = function (comName, index, filePath, direct) {
  const spinner = ora('').start();
  const { status, configFile, filePath: formatFilePath } = fileCheck(filePath, spinner);
  if (!status) {
    return false;
  }

  if (index === undefined) {
    index = configFile.items.length;
  }

  const item = configFile.items.splice(index - 1, 1);
  configFile.items.splice(index - 1, 0, {
    ...item[0],
    component: comName,
  });

  printAndConfirm(
    formatFilePath,
    spinner,
    'module.exports = ' + JSON.stringify(configFile, null, 2),
    {
      direct,
    });
}