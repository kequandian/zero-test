
const ora = require('ora');
const fsExtra = require('fs-extra');
const cwd = process.cwd();
const path = require('path');
const routerUtils = require('../../utils/router');
const templateReplace = require('../../utils/templateReplace');
const swaggerRead = require('../../utils/swagger/read');
const confirm = require('../../utils/confirm');

module.exports = function (pageName, dirPath, API) {
  const spinner = ora(`追加后台管理子页面： ${pageName}`).start();
  dirPath = path.resolve(cwd, dirPath);

  const [parentPageName, childPageName] = pageName.split('/');
  const parentPageNameUpperCase = parentPageName.replace(/^\S/, s => s.toUpperCase());
  const childPageNameUpperCase = childPageName.replace(/^\S/, s => s.toUpperCase());
  const outFilePath = path.normalize(`${dirPath}/src/pages/${parentPageNameUpperCase}`);
  const routerFilePath = path.normalize(`${dirPath}/config/router.config.js`);
  const router = routerUtils(routerFilePath);

  spinner.info(`添加 child 文件: ${outFilePath}/${childPageName}.js`);

  fsExtra.copy(
    `${__dirname}/template/childPage.js`,
    `${outFilePath}/${childPageNameUpperCase}.js`,
  )
    .then(() => {
      templateReplace(outFilePath, 'ZERO_childNameUpperCase', childPageNameUpperCase);
      templateReplace(outFilePath, 'ZERO_childName', childPageName);
      templateReplace(outFilePath, 'ZERO_parentName', parentPageName);
      templateReplace(outFilePath, 'ZERO_API', API);
      spinner.succeed(`child 文件已添加`);

      return fsExtra.copy(
        `${__dirname}/template/childConfig/index.js`,
        `${outFilePath}/config/${childPageName}/index.js`,
      );
    })
    .then(async () => {
      if (API) {
        const data = await swaggerRead(API);
        if (data instanceof Error) {
          spinner.fail(data.message);
          return false;
        }
        spinner.info(`使用 API: ${API} 生成配置文件`);
        return createFile(`${outFilePath}/config/${childPageName}/formConfig.js`, getFields(data));
      } else {
        spinner.info(`生成标准配置文件`);
        return createFile(`${outFilePath}/config/${childPageName}/formConfig.js`);
      }
    });

  spinner.info(`添加路由信息`);
  router.append(
    parentPageName,
    {
      path: `/${parentPageName}/${childPageName}`, // 都要首字母小写
      name: childPageNameUpperCase, // 首字母大写
      component: `./${parentPageNameUpperCase}/${childPageNameUpperCase}`, // 都要首字母大写
    }
  )
    .then(() => {
      spinner.succeed(`路由信息已添加`);
    });
}

function createFile(filePath, fields) {
  const itemTemplate = {
    fields: [
      { field: 'id', label: 'ID' },
      { field: 'name', label: '名称' },
    ],
  };
  if (fields) {
    itemTemplate.fields = fields;
  }

  const date = 'module.exports = ' + JSON.stringify(itemTemplate, null, 2);
  return fsExtra.outputFile(filePath, date);
}
function getFields(data) {
  return data.post && data.post.fields || data.put && data.put.fields || [];
}