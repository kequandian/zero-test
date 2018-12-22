#!/usr/bin/env node

const program = require('commander');
const shell = require('shelljs');

const cloneBin = require('./bin/clone');
const lsBin = require('./bin/ls');
const createBin = require('./bin/create');

const { comAdd, comUpdate, comDelete } = require('./bin/com');

const { ls: swaggerLs, format: swaggerFormat } = require('./bin/swagger');
const { create: formCreate } = require('./bin/form');
const { init: manageInit, add: manageAdd } = require('./bin/manage');

if (!(shell.env.EXEPATH && shell.env.EXEPATH.indexOf('Git'))) {
  console.log('请在 Git Shell 的 CLI 环境下运行');
  return false;
}

program
  .version(require('./package').version)
  .description('修改 json 文件，完成模板编辑')
  .option('-f, --filePath [filePath]', '命令所操作的文件')
  .option('-i, --index [index]', '所操作项在配置文件中的位置')
  .option('-d, --direct [direct]', '直接进行操作，不提示确认', false)
  .option('-p, --dirPath [dirPath]', '命令所操作的目录', './')
  .option('--API [API]', '指定操作的 API', '')

program
  .command('clone')
  .description('下载 或 更新 模板')
  .action(function () {
    cloneBin('kequandian/zero-layout', `${__dirname}/template/layout`);
  })
program
  .command('ls')
  .description('列出可用的组件')
  .action(function () {
    lsBin();
  })
program
  .command('new <fileName>')
  .description('新增配置文件')
  .action(function (fileName) {
    createBin(fileName, program.filePath);
  })
program
  .command('com <action> <comName>')
  .description('对组件进行 增删改 操作')
  .action(function (action, comName) {
    const actionMap = {
      'add': (comName, index, filePath, direct) => {
        comAdd(comName, index, filePath, direct);
      },
      'update': (comName, index, filePath, direct) => {
        comUpdate(comName, index, filePath, direct);
      },
      'delete': (comName, index, filePath, direct) => {
        comDelete(comName, index, filePath, direct);
      },
      'undefined': () => {
        console.log('无效的 action。可选 add | update | delete');
      },
    };
    (actionMap[action] || actionMap[undefined])(comName, program.index, program.filePath, program.direct);
  })
program
  .command('swagger <action> [arguments]')
  .description([
    'swagger 工具',
    '  -> swagger ls [filter] 列出 swagger 可用的 API',
    '  -> swagger format 重新 format swagger.json 文件',
  ].join('\n'))
  .action(function () {
    const [action, ...restArg] = arguments;
    const actionMap = {
      'ls': (filter) => {
        swaggerLs(filter);
      },
      'format': () => {
        swaggerFormat();
      },
      'undefined': () => {
        console.log('无效的 action。可选 ls | format');
      },
    };
    (actionMap[action] || actionMap[undefined])(...restArg);
  })
program
  .command('form <fileName>')
  .description([
    '新增一个表单配置文件',
    '  --API 从 swagger 里面读取对应的 API 字段来生成配置文件',
  ].join('\n'))
  .action(function (fileName) {
    // fixed Git Shell 会自动把 / 识别为 C:/Program Files/Git/  的毛病
    const API = program.API.replace(shell.env.EXEPATH.replace(/\\/g, '/'), '');
    formCreate(fileName, program.filePath, API);
  })
program
  .command('manage <action> [arguments]')
  .description([
    '后台管理项目 工具',
    '  -> manage init <projectName> 初始化一个后台管理项目',
    '  -> manage add <pageName> 添加页面',
  ].join('\n'))
  .action(function () {
    const [action, ...restArg] = arguments;
    const actionMap = {
      'init': (projectName) => {
        manageInit(projectName, program.dirPath, program.direct);
      },
      'add': (pageName) => {
        const API = program.API.replace(shell.env.EXEPATH.replace(/\\/g, '/'), '');
        manageAdd(pageName, program.dirPath, API);
      },
      'undefined': () => {
        console.log('无效的 action。可选 ls | format');
      },
    };
    (actionMap[action] || actionMap[undefined])(...restArg);
  })

program.parse(process.argv)