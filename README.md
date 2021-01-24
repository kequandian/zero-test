
# zero-test

## Install
`git clone https://github.com/kequandian/zero-test.git`  
`sh ./init install`

## Usage
```
Usage: zero-test <method> <api> [options] [value ...]

Options:
  --out                                           输出结果
  --report                                        输出并将结果记录日志
  --info                                          从swagger中获取api描述
  --parent                                        仅输出主表
  --head
  --tail
  --notnull                                       default option
  --all
  --table <value>                                 指定数据库表生成请求参数
  --swagger                                       从swagger中获取api所需字段信息生成请求参数
  --filter <value>                                添加或替换生成参数
  --only                                          仅处理当前api，post/put请求后不带回get列表
  --save <field>                                  保存当前api返回的某字段值(id...), 通过#SAVE_VALUE使用该值
  -h, --help                                      output usage information

Commands:
  login <endpoint> <account> <password> [report]
  pdf [options] <outputFile>
  journal <cms> [option]
  server <cmd> [options]
  test [options] <testcase> <journal-file>        多api组合测试
Example: login api admin 111111
         journal help
         get /api/cms/article/categories --out
         post /api/cms/article/categories --filter='{"key":"value","array":[1,2,3],"items":{"key":"value"}}' --out --table=article_category
         test demo/testcase-demo demo/testcase-demo.pdf
```

**Journal**
```
$ zero-test journal --help
Usage: journal [options] <cms> [option]

Options:
  -h, --help  output usage information

Usage:
   journal ls
   journal current
   journal set <journal-file>
   journal rm <journal-file>
   journal rewrite
```

**PDF**
```
$ zero-test pdf --help
Usage: pdf [options] <outputFile>

Options:
  --target <target_file>  指定需转换成pdf的原文件, 不进行指定则默认转换当前所选日志文件
  -h, --help              output usage information

Usage:
   pdf demo/testcase.pdf
   pdf demo/testcase.pdf --target=test-env/pub/logs/testcase
```

**testcase**
```
Usage: test [options] <testcase> <journal-file>

多api组合测试

Options:
  -f, --force  执行整个testcase,不被错误返回所打断
  -h, --help   output usage information

Usage:
   test demo/testcase demo/testcase.pdf
```

## How to use
### Base
1. 安装 
```
$ ./init install
```
2. 配置子工作目录 (可选)
```
$ ./init map ‪C:/Users/10238/Desktop/
map zero-test to C:/Users/10238/Desktop/ ...
done!
```
3. 修改配置文件(若使用子工作目录，进行相应切换即可)
```
$ vim test-env/server.config
module.exports = {
    host: 'http://127.0.0.1:8080/',
    mysql: {
        host : '127.0.0.1',
        port : 3306,
        database : 'env_test',
        user : 'root',
        password : 'root'
    }
};

---------------- OR ----------------
$ zero-test server --help
Usage: server [options] <host> <port>

Options:
  -h, --help  output usage information

$ zero-test mysql --help
Usage: mysql [options] <opt> [argv1] [argv2]

mysql <host|database|user> [argv1] [argv2]

Options:
  -h, --help  output usage information
Example: mysql set host 127.0.0.1 3306
         mysql set database zero-test
         mysql set user root root


```
4. 设置日志(设置日志文件，清空文件内容)
```
$ zero-test journal set testcase
$ zero-test journal rewrite
```
5. 登录（api访问请求头需要带上Authorization时可选)
```
$ zero-test login sys admin 111111
```
6. 调用api并输出
```
$ zero-test post /api/eav/entities --filter='{"entityName":"E1"}' --out

post--/api/eav/entities
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
7. 获取列表api第一条数据id并查询其详情(即相当于调用get /api/eav/entities/3), 并将返回字段id的值保存
```
$ zero-test get /api/eav/entities --head --save=id --out

get--/api/eav/entities
+-----------------+
|      data       |
+────+────────────+
| id │ entityName |
+────┼────────────+
| 3  │ E1         |
+----+------------+
```
8. 通过保存值调用api, 并保存字段entityName的值
```
$ zero-test get api/eav/entities/#SAVE_VALUE --save=entityName --out

get--/api/eav/entities/3
+-----------------+
|      data       |
+────+────────────+
| id │ entityName |
+────┼────────────+
| 3  │ E1         |
+----+------------+
```
9. 通过保存值post数据
```
$ zero-test post /api/eav/entities --filter='{"entityName":"#SAVE_VALUE"}' --out

post--/api/eav/entities
+--------------------------+
|           data           |
+──────+────────+──────────+
| code │ errors │ message  |
+──────┼────────┼──────────+
| 4007 │ []     │ 重复键值 |
+------+--------+----------+
```
执行的sql为
```
==>  Preparing: INSERT INTO t_eav_entity ( entity_name ) VALUES ( ? ) 
==> Parameters: E1(String)
```
10. 单post调用并将结果记录日志
```
$ zero-test post /api/eav/entities --filter='{"entityName":"E2"}' --only --report

post--/api/eav/entities
+------------------------+
|          data          |
+──────+──────+──────────+
| code │ data │ message  |
+──────┼──────┼──────────+
| 200  │ 1    │ 操作成功 |
+------+------+----------+
```
11. 调用GET请求并记录
```
$ zero-test get /api/eav/entities --report

get--/api/eav/entities
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
12. 将日志中记录的内容导出pdf
```
$ zero-test pdf demo/testcase.pdf
converting pdf from pub/logs/testcase to demo/testcase.pdf
Done
```
### Testcase
1. 编写testcase
```
$ cat demo/testcase_demo

## 组合api测试
zero-test journal set testcase
zero-test journal rewrite
# set journal testcase
# journal rewrite

# 管理员登录
zero-test login sys admin 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织A用户登录
zero-test login sys user1234 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织A1用户登录
zero-test login sys user12341 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织B用户登录
zero-test login sys user12345 111111 report
# 获取组织列表
zero-test get /api/sys/org
```
2. 执行testcase
```
$ zero-test test demo/testcase_demo demo/testcase_demo.pdf
testcase running...

## 组合api测试
zero-test journal set testcase
zero-test journal rewrite
# set journal testcase
# journal rewrite

# 管理员登录
zero-test login sys admin 111111 report
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2414  100  2356  100    58   2356     58  0:00:01 --:--:--  0:00:01 77870
# 获取组织列表
zero-test get /api/sys/org
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
$ zero-test get /api/cms/article/categories --out
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
$ zero-test post /api/cms/article/categories --out --table=article_category
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
$ zero-test put /api/cms/article/categories --out --table=article_category --tail --filter='{name:test}'
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
$ zero-test delete /api/cms/article/categories --out --tail
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
$ zero-test get /api/cms/article/categories --report
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

$ zero-test pdf pub/logs/2018-12-25.log demo.pdf
converting pdf from pub/logs/2018-12-25.log to demo.pdf
Done
```

### Testcase
```
$ zero-test test demo/testcase_demo demo/testcase_demo.pdf

```

