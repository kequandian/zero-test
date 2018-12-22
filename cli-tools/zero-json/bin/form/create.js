
const ora = require('ora');
const fs = require('fs-extra');
const createBin = require('../create');
const swaggerRead = require('../../utils/swagger/read');
const fileCheck = require('../../utils/fileCheck');

module.exports = function (name, filePath, API) {
  const spinner = ora(`新增 表单 配置文件 ${name}`).start();
  if (API) {
    swaggerRead(API).then((data) => {
      if (data instanceof Error) {
        spinner.fail(data.message);
        return false;
      }
      createFile(name, filePath, {
        API,
        fields: data.post && data.post.fields || data.put && data.put.fields || [],
        spinner,
      });
    });
  } else {
    createFile(name, filePath, {
      spinner,
    });
  }
}
function createFile(name, filePath, { API, fields, spinner }) {
  return createBin(name, filePath).then((absolutePath) => {
    const itemTemplate = {
      API: {
        listAPI: API,
        deleteAPI: `${API}/(id)`,
      },
      span: 24,
      component: 'BaseList',
      config: {
        fields: [
          { field: 'id', label: 'ID' },
          { field: 'name', label: '名称' },
        ],
        operation: [
          { title: '删除', action: 'delete' },
        ],
      },
    };
    if (fields) {
      itemTemplate.config.fields = fields;
    }

    const { status, configFile, filePath: formatFilePath } = fileCheck(absolutePath, spinner);
    if (!status) {
      return false;
    }

    configFile.items.push(itemTemplate);

    const date = 'module.exports = ' + JSON.stringify(configFile, null, 2);
    return fs.outputFile(formatFilePath, date);
  })
    .catch(() => {
      spinner.fail(`配置文件 ${filePath} 生成失败`);
    });
}