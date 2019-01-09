
# env-test
## Install
`git clone https://github.com/kequandian/env-test.git`  
`./init install`
## Usage

`./init get swagger <url>`
```
Usage: index <method> <api> [options] [value ...]

Options:
  -o, --out
  -r, --report
  -p, --parent
  --head
  --tail
  --notnull                                       默认值, 仅生成notnull字段
  --all
  --table, <value>                                指定数据库表生成请求参数
  --swagger                                       从swagger中获取字段信息生成请求参数
  --filter <value>                                添加或替换生成参数 {key1:value1,key2:value2}
  --only                                          仅处理当前api，post/put请求后不带回get列表
  -h, --help                                      output usage information

Commands:
  login <endpoint> <account> <password> [report]
  pdf <outputFile>
  test <testcase> <journal-file>
  journal <cmd> [option]

Example: GET api/cms/article/categories --out
         login api admin 111111

```
**Journal**
```
$ env-test journal help
Usage:
   journal ls
   journal current
   journal set <journal-file>
   journal rm <journal-file>
   journal rewrite
```

## How to use
### Base

1. 修改配置文件
```
$ vim conf/server.config

module.exports = {
    host: 'http://127.0.0.1:8080/',
    mysql: {
        host : '127.0.0.1',
        port : 3306,
        database : 'env_test',
        user : 'root',
        password : 'root'
    },
    login_info: {
        sys: 'api/sys/oauth/login'
    }
};
```
2. 设置日志(设置日志文件，清空文件内容)
```
$ node index journal set testcase
$ node index journal rewrite
```
3. 登录（api访问请求头需要带上Authorization时可选)
```
$ node index login sys admin 111111
```
4. 调用api并输出
```
$ node index post /api/eav/entities --filter='{"entityName":"E1"}' --out

post--api/eav/entities
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"entityName":"E1",... │ 10   │ 1     |
+---------+-------+-------------------------+------+-------+
+-----------------------------------+
|           data#records            |
+─────+────+────────────+───────────+
| row │ id │ entityName │ tableName |
+─────┼────┼────────────┼───────────+
| 0   │ 3  │ E1         │           |
+-----+----+------------+-----------+
```
5. 单post调用并将结果记录日志
```
$ node index post /api/eav/entities --filter='{"entityName":"E2"}' --only --report

post--api/eav/entities
+------------------------+
|          data          |
+──────+──────+──────────+
| code │ data │ message  |
+──────┼──────┼──────────+
| 200  │ 1    │ 操作成功 |
+------+------+----------+
```
6. 调用GET请求并记录
```
$ node index get /api/eav/entities --report

get--api/eav/entities
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"entityName":"E1",... │ 10   │ 2     |
+---------+-------+-------------------------+------+-------+
+-----------------------------------+
|           data#records            |
+─────+────+────────────+───────────+
| row │ id │ entityName │ tableName |
+─────┼────┼────────────┼───────────+
| 0   │ 4  │ E1         │           |
+─────┼────┼────────────┼───────────+
| 1   │ 5  │ E2         │           |
+-----+----+------------+-----------+
```
7. 将日志中记录的内容导出pdf
```
$ node index pdf demo/testcase.pdf
converting pdf from pub/logs/testcase to demo/testcase.pdf
Done
```
### Testcase
1. 编写testcase
```
$ cat demo/testcase_demo

## 组合api测试
node index journal set testcase
node index journal rewrite
# set journal testcase
# journal rewrite

# 管理员登录
node index login sys admin 111111 report
# 获取组织列表
node index get api/sys/org

# 组织A用户登录
node index login sys user1234 111111 report
# 获取组织列表
node index get api/sys/org

# 组织A1用户登录
node index login sys user12341 111111 report
# 获取组织列表
node index get api/sys/org

# 组织B用户登录
node index login sys user12345 111111 report
# 获取组织列表
node index get api/sys/org
```
2. 执行testcase
```
$ node index test demo/testcase_demo demo/testcase_demo.pdf
testcase running...

## 组合api测试
node index journal set testcase
node index journal rewrite
# set journal testcase
# journal rewrite

# 管理员登录
node index login sys admin 111111 report
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2414  100  2356  100    58   2356     58  0:00:01 --:--:--  0:00:01 77870
# 获取组织列表
node index get api/sys/org
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed

......(在此省略中间输出,不做全部显示)

export report: demo/testcase_demo.pdf
converting pdf from pub/logs/testcase to demo/testcase_demo.pdf
Done
```


## Demo
### Base
```
$ env-test get api/cms/article/categories --out
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"allowImage":100,"... │ 10   │ 4     |
+---------+-------+-------------------------+------+-------+
+------------------------------------------------------+
|                     data#records                     |
+─────+────────────+───────────+────+─────────+────────+
| row │ allowImage │ fastEntry │ id │  name   │ typeId |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 0   │ 100        │ 9         │ 11 │ zy      │ 7057   |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 1   │ 44         │ 38        │ 24 │ hXRr>   │ 117    |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 2   │ 23         │ 104       │ 25 │ zli.<-3 │ 49     |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 3   │ 63         │ 93        │ 26 │ !H      │ 36     |
+-----+------------+-----------+----+---------+--------+
```
```
$ env-test post api/cms/article/categories --out --table=article_category
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"allowImage":100,"... │ 10   │ 5     |
+---------+-------+-------------------------+------+-------+
+-------------------------------------------------------------------------------------------------------------+
|                                                data#records                                                 |
+─────+────────────+───────────+────+────────────────────────────────────────────────────────────────+────────+
| row │ allowImage │ fastEntry │ id │                              name                              │ typeId |
+─────┼────────────┼───────────┼────┼────────────────────────────────────────────────────────────────┼────────+
| 0   │ 100        │ 9         │ 11 │ zy                                                             │ 7057   |
+─────┼────────────┼───────────┼────┼────────────────────────────────────────────────────────────────┼────────+
| 1   │ 44         │ 38        │ 24 │ hXRr>                                                          │ 117    |
+─────┼────────────┼───────────┼────┼────────────────────────────────────────────────────────────────┼────────+
| 2   │ 23         │ 104       │ 25 │ zli.<-3                                                        │ 49     |
+─────┼────────────┼───────────┼────┼────────────────────────────────────────────────────────────────┼────────+
| 3   │ 63         │ 93        │ 26 │ !H                                                             │ 36     |
+─────┼────────────┼───────────┼────┼────────────────────────────────────────────────────────────────┼────────+
| 4   │ 1          │ 0         │ 27 │ 8sMSk?&r~iV^_Sqw76*IcE#PIbq1>!GA7Mh*7boxYkTVdGI_KrpEc5z^A?b255 │ 29727  |
+-----+------------+-----------+----+----------------------------------------------------------------+--------+

```
```
$ env-test put api/cms/article/categories --out --table=article_category --tail --filter='{name:test}'
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"allowImage":100,"... │ 10   │ 5     |
+---------+-------+-------------------------+------+-------+
+------------------------------------------------------+
|                     data#records                     |
+─────+────────────+───────────+────+─────────+────────+
| row │ allowImage │ fastEntry │ id │  name   │ typeId |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 0   │ 100        │ 9         │ 11 │ zy      │ 7057   |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 1   │ 44         │ 38        │ 24 │ hXRr>   │ 117    |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 2   │ 23         │ 104       │ 25 │ zli.<-3 │ 49     |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 3   │ 63         │ 93        │ 26 │ !H      │ 36     |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 4   │ 1          │ 0         │ 27 │ test    │ 6283   |
+-----+------------+-----------+----+---------+--------+
```
```
$ env-test delete api/cms/article/categories --out --tail
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"allowImage":100,"... │ 10   │ 4     |
+---------+-------+-------------------------+------+-------+
+------------------------------------------------------+
|                     data#records                     |
+─────+────────────+───────────+────+─────────+────────+
| row │ allowImage │ fastEntry │ id │  name   │ typeId |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 0   │ 100        │ 9         │ 11 │ zy      │ 7057   |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 1   │ 44         │ 38        │ 24 │ hXRr>   │ 117    |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 2   │ 23         │ 104       │ 25 │ zli.<-3 │ 49     |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 3   │ 63         │ 93        │ 26 │ !H      │ 36     |
+-----+------------+-----------+----+---------+--------+
```
### Report
```
$ env-test get api/cms/article/categories --report
+----------------------------------------------------------+
|                           data                           |
+─────────+───────+─────────────────────────+──────+───────+
| current │ pages │ records                 │ size │ total |
+─────────┼───────┼─────────────────────────┼──────┼───────+
| 1       │ 1     │ [{"allowImage":100,"... │ 10   │ 4     |
+---------+-------+-------------------------+------+-------+
+------------------------------------------------------+
|                     data#records                     |
+─────+────────────+───────────+────+─────────+────────+
| row │ allowImage │ fastEntry │ id │  name   │ typeId |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 0   │ 100        │ 9         │ 11 │ zy      │ 7057   |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 1   │ 44         │ 38        │ 24 │ hXRr>   │ 117    |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 2   │ 23         │ 104       │ 25 │ zli.<-3 │ 49     |
+─────┼────────────┼───────────┼────┼─────────┼────────+
| 3   │ 63         │ 93        │ 26 │ !H      │ 36     |
+-----+------------+-----------+----+---------+--------+

$ env-test pdf pub/logs/2018-12-25.log demo.pdf
converting pdf from pub/logs/2018-12-25.log to demo.pdf
Done
```

### Testcase
```
$ env-test test demo/testcase_demo demo/testcase_demo.pdf

```

