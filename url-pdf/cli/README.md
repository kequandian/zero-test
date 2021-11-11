# PDF转换工具

### 工具说明

这个工具可以用于转换本地的HTML文件和网站成PDF

### 实操说明

#### 第一次使用工具

在 主目录里 使用 
```bash
./app.sh -I 
```
进行初始化工具 初始化完成后

把dist放在cli主文件夹中 然后输入
./app.sh -E 打开 dist服务器

```bash
如果端口冲突 执行
./app.sh -P 8001
进行更改端口 8001指端口 可变更为其它端口
然后执行
./app.sh -S 
打开工具
也可直接操作为 ./app.sh -P 8001 -S
```
上面两种方法起同等作用

打开工具之后，执行
```bash
./app.sh -N (输出的pdf文件名字) -B (需要转换的地址) -T
```
即可生成pdf。pdf的生成地址在cli主目录


这里注意，需要转换的地址可以为本地的html文件 相对于pdf-cli目录的路径 也可以是绝对路径 或者网页地址

### 命令说明

./app.sh (-I) (-P 端口) (-S) (-U) (-N pdf名称) (-B 转换地址) (-T) (-H) (-L)

-H：查看帮助

./app.sh -H

-I：初始化工具

./app.sh -I

-P：更改工具端口（如果端口冲突，先更改工具端口，再打开工具）

./app.sh -P 8000

-S：打开工具

./app.sh -S

-U：更新工具

./app.sh -U

-T：生成pdf 并自动存放入pdf文件夹

./app..sh -T

-N：设定pdf名称 默认pdf名称为defaultPdf 需要配合 -T 使用

./app.sh -N newPdf -T

-L：查看今天的log

./app.sh -L

-B：设定地址url 可为本地dist 也可为网络链接 需要配合-T 使用

./app.sh -B http://www.baidu.com -T

-T -N -B 的综合应用

./app.sh -N newPdf -B http://www.baidu.com -T

-E 打开dist的服务器

./app.sh -E

注意：默认的 -N 名称是defaultPdf 默认 -B 的地址是http://www.baidu.com -B 的地址可以使用绝对路径 或相对于pdf-cli目录的路径
