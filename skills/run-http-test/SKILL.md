---
name: run-http-test
description: 通用 HTTP API 测试技能。执行 .http 测试文件，对目标 API 发送真实 HTTP 请求，输出实时 PASS/FAIL 控制台结果，并自动生成 Markdown 测试报告。支持按标题子串过滤测试用例（支持逗号分隔多条件，如 TC-001,TC-005；支持范围表达式，如 TC-001:TC-010）。
---

# run-http-skill

通用 HTTP API 测试技能，可从任何项目目录执行 `.http` 格式的测试文件。

> **位置说明**: 本文档 (SKILL.md) 位于技能目录根目录，所有路径均相对于此目录。

## 触发条件

当需要：
- 对运行中的 API 服务执行 `.http` 测试文件
- 验证 RESTful API 接口是否正常工作
- 获取每个测试用例的 PASS/FAIL 状态与 HTTP 状态码
- 生成 API 测试报告（Markdown 格式）

## 前置条件

- Node.js 已安装（`node --version`）
- npm 依赖已安装：
  ```bash
  cd (技能目录)
  npm install
  ```
- 目标 API 服务已运行

## 使用方法

### 基本用法

```bash
node (技能目录)/test-runner-simple.js <test-file.http> [output-dir] [report-name] [--filter <substring>]
```

**参数说明**：

| 参数 | 说明 | 是否必填 | 示例 |
|-----|------|----------|------|
| `<test-file.http>` | `.http` 测试文件路径（相对或绝对路径） | 必填 | `tests/api-tests.http` |
| `[output-dir]` | 报告输出目录（自动创建） | 可选 | `tests/output` |
| `[report-name]` | 报告文件名（不含扩展名） | 可选 | `api-test-report` |
| `--filter` | 仅运行标题包含指定过滤条件的测试用例（不区分大小写）<br/>• 逗号分隔：`TC-001,TC-005`<br/>• 范围表达式：`TC-001:TC-010` (展开为 001-010)<br/>• 混合使用：`TC-001:TC-005,TC-008`<br/>• OR 逻辑：匹配任一条件即运行 | 可选 | `TC-001`、`TC-001,TC-005`、`TC-001:TC-010`、`创建用户` |

**默认值**：
- `output-dir`: `.http` 文件所在目录下的 `./output/` 子目录
- `report-name`: 与 `.http` 文件同名

### 使用示例

假设技能位于 `skills/run-http-skill`：

```bash
# 最简单用法：使用默认输出目录和报告名
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http
# 输出: tests/output/api-tests.md

# 自定义输出目录（使用默认报告名）
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http custom-output
# 输出: custom-output/api-tests.md

# 自定义输出目录和报告名
node skills/run-http-skill/test-runner-simple.js \
  tests/eav-api-test.http \
  tests/output \
  eav-report
# 输出: tests/output/eav-report.md

# 使用绝对路径
node /path/to/skills/run-http-skill/test-runner-simple.js \
  /path/to/project/tests/api-tests.http
# 输出: /path/to/project/tests/output/api-tests.md

# 仅运行标题包含 "TC-001" 的测试用例
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter TC-001

# 仅运行标题包含 "创建用户" 的测试用例
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter 创建用户

# 多条件过滤：仅运行标题包含 "TC-001" 或 "TC-005" 或 "TC-010" 的测试用例
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter TC-001,TC-005,TC-010

# 范围过滤：运行 TC-001 到 TC-010 的所有测试用例
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter TC-001:TC-010

# 混合过滤：运行 TC-001 到 TC-005，以及 TC-008
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter TC-001:TC-005,TC-008

# 反向范围：自动识别并从小到大展开（TC-008:TC-002 等同于 TC-002:TC-008）
node skills/run-http-skill/test-runner-simple.js tests/api-tests.http --filter TC-008:TC-002

# 组合使用：自定义输出 + 过滤器
node skills/run-http-skill/test-runner-simple.js \
  tests/api-tests.http \
  custom-output \
  custom-report \
  --filter TC-001:TC-010
```

### 创建便捷别名（可选）

在项目的 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "test:http": "node skills/run-http-skill/test-runner-simple.js tests/api-tests.http"
  }
}
```

然后运行：`npm run test:http`

## .http 文件格式

### 变量定义

```http
@baseUrl = http://localhost:3000/api
@contentType = application/json
@token = your-auth-token
```

- 以 `@` 开头，支持在请求 URL、Header、Body 中用 `{{varName}}` 引用

### 动态变量提取

从 API 响应中提取值并在后续请求中使用：

```http
### 创建资源
# 创建新资源并捕获其 ID

POST {{baseUrl}}/resources
Authorization: Bearer {{token}}

{
    "name": "测试资源",
    "type": "test"
}

# @extract data.id -> resourceId

### 获取创建的资源
# 使用提取的 ID 获取资源

GET {{baseUrl}}/resources/{{resourceId}}
Authorization: Bearer {{token}}

### 更新资源
# 使用捕获的 ID 更新资源

PUT {{baseUrl}}/resources/{{resourceId}}
Authorization: Bearer {{token}}

{
    "name": "已更新的资源"
}

### 删除资源
# 清理测试数据

DELETE {{baseUrl}}/resources/{{resourceId}}
Authorization: Bearer {{token}}
```

**提取器语法**: `# @extract <JSONPath> -> <变量名>`

- 使用点表示法访问嵌套值：`data.user.id`、`items.0.name`
- 提取的变量在所有后续测试中持久存在
- 变量可在 URL、Header 和请求 Body 中使用
- 如果路径不存在，不会创建变量（不会报错）

### 父资源、外键与删除顺序（提高通过率，必读）

模块内若存在 **父子 / 外键** 关系（例如 `batch_id` → 迎新批次、`notice_id` → 公告），编写 `.http` 时必须遵守：

1. **禁止过早删除父资源**：凡后续请求 Body 仍引用 `{{parentId}}`（如 `batch_id`），**不得**在该父资源的 `DELETE` 之前执行这些请求。典型错误：先 `DELETE` 批次，再对子表 `POST` → 服务端常返回 **500**，且子资源创建失败导致 **`@extract` 未执行**，后续 URL 会残留占位符字面量 **`dynamic`**，出现 **404 / 4020**。
2. **推荐顺序**：对每个需父 ID 的实体，完成 **POST → GET → 列表 GET → PUT → DELETE（子）**；**所有**依赖该父 ID 的实体块全部结束后，再 **`DELETE` 父资源**；或将父资源 **`DELETE` 置于文件末尾**「收尾清理」单独一节。
3. **可选隔离**：各业务大段可 **各自 POST 一个新父资源** 并 `@extract`，避免多段共用同一父 ID 时被前段删除污染。

详见 [references/SYNTAX.md](references/SYNTAX.md) 中「多实体依赖与外键」。

### 测试用例格式

```http
### 测试用例标题
# 描述（可选）

GET {{baseUrl}}/users
Authorization: Bearer {{token}}

### 创建用户
POST {{baseUrl}}/users
Content-Type: {{contentType}}

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**支持的 HTTP 方法**：GET、POST、PUT、PATCH、DELETE

## 输出

### 控制台输出

```
============================================================
Zero-Test Runner (Simple Version)
============================================================
Test File:    tests/api-tests.http
Output Dir:   tests/output
Report Name:  api-test-report
============================================================

Found 5 test cases

Running tests...
------------------------------------------------------------
[1] ✓ PASS - 获取用户列表 (200 OK, 45ms)
[2] ✓ PASS - 创建用户 (201 Created, 82ms) [Extracted: userId=123]
[3] ✓ PASS - 获取用户详情 (200 OK, 38ms) [Extracted: userName=张三, email=zhangsan@example.com]
[4] ✗ FAIL - 更新用户 (400 Bad Request, 55ms)
...
------------------------------------------------------------

Test Execution Summary
============================================================
Total Tests:   5
Passed:        3
Failed:        2
Duration:      1.23s
Pass Rate:     60%
============================================================

Markdown report saved: tests/output/api-test-report.md
```

### Markdown 报告

自动生成：`<output-dir>/<report-name>.md`

包含：
- 测试概览（总数、通过、失败、耗时）
- 每个测试用例的详细信息
- **Request body**（当 `.http` 用例块内声明了请求体时，写入报告，JSON 会格式化）
- 响应体（Response）

## 判定规则

| 结果 | 条件 |
|-----|------|
| PASS | HTTP 状态码 2xx |
| FAIL | HTTP 状态码非 2xx，或连接失败 |
| SKIP | 用例解析为空（无 HTTP 方法行） |

## 依赖

- `axios` - HTTP 客户端

安装依赖：
```bash
cd (技能目录)
npm install axios
```

## 文件结构

```
(技能目录)/
├── SKILL.md                      # 本文档
├── test-runner-simple.js         # 主测试运行器
├── package.json                  # npm 配置
├── scripts/
│   ├── parser.js                 # .http 文件解析器
│   ├── http.js                   # HTTP 客户端 (axios)
│   ├── http-native.js            # HTTP 客户端 (native)
│   └── runner.js                 # 测试执行引擎
├── assets/
│   └── markdown.css              # Markdown 样式
└── references/
    └── SYNTAX.md                 # .http 语法参考
```

## 常见问题

**Q: 如何处理需要认证的 API？**

A: 在 `.http` 文件顶部定义 token 变量：
```http
@token = Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Q: 如何调试失败的测试？**

A: 查看 Markdown 报告中的详细请求/响应信息，包括：
- 完整请求 URL
- 请求头
- 请求体
- 响应状态码
- 响应体

**Q: 支持哪些 HTTP 方法？**

A: GET、POST、PUT、PATCH、DELETE（大小写不敏感）

**Q: 为何失败请求 URL 里出现 `/resources/dynamic`？**

A: 预声明变量（如 `@x = dynamic`）未被成功的 **`# @extract`** 覆盖时，字面量会原样拼进 URL。常见原因是前置 **POST 失败**（例如父资源已删导致外键无效）。请调整用例顺序：先保证父资源存在，再创建子资源并完成 extract。

## 相关文档

- [.http 语法参考](references/SYNTAX.md) - 完整的 .http 文件语法说明
