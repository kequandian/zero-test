# pdf工具包
## 文件夹说明

### cli
说明：pdf生成工具

[前往文档说明](./cli/README.md)

### nodeTool
说明：与模板配合使用的api

使用方法：

安装：npm i

开启：npm start

端口更改方法：

更改 config.js 中的 port 即可

### template：

说明：pdf打印模板

只保留了dist，可配合nodeTool中的api使用，只需把dist中的config.js更改为api所在的地址即可

模板代码原地址:

网页地址：https://github.com/kequandian/zero-element-admin/tree/pdfTemplate

git地址：git@github.com:kequandian/zero-element-admin.git --single-branch pdfTemplate

## 生成pdf方法

通过操作把cli里的pdf生成工具打开，然后打开api，在cli目录里输入
```
./app.sh -N (pdf名) -B (路径) -T
```
这里的路径 可以是template里的dist的绝对路径 或 相对于cli/pdf-cli的相对路径即可 也可直接将template中的dist直接跑起来，然后输入template的网页地址

pdf会生成在cli工具的pdf文件夹中。