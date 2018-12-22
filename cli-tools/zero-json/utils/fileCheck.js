
const filePathFormat = require('./filePathFormat');

module.exports = function fileCheck(filePath, spinner) {
  let status = false;
  let configFile = {};

  if (filePath === undefined) {
    spinner.fail('必须输入需要操作的文件。可通过 -f 参数指定');
  }
  filePath = filePathFormat(filePath);

  try {
    configFile = require(filePath);
    status = true;
  } catch (error) {
    spinner.fail(`找不到配置文件 ${filePath}`);
  }

  return {
    status,
    configFile,
    filePath,
  };
}