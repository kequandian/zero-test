---
name: run-http-skill
description: 执行 .http 测试文件的技能。解析 .http 格式中的变量定义、HTTP 请求（GET/POST/PUT/PATCH/DELETE）、请求头、JSON Body，逐条发送请求，输出实时 PASS/FAIL 控制台结果，并自动保存 Markdown 测试报告到指定输出目录。
---

# run-http-skill

执行 `.http` 格式测试文件，对目标 API 发送真实 HTTP 请求，输出测试结果。

## 触发条件

当需要：
- 对运行中的 API 服务执行 `.http` 测试文件中的用例
- 验证 EAV-Rust 服务、业务逻辑服务的接口是否正常
- 获取每个测试用例的 PASS/FAIL 状态与 HTTP 状态码

## 前置条件

- Node.js 已安装（`node --version`）
- npm 依赖已安装：`cd zero-test && npm install`（依赖 `axios`）
- 目标 API 服务已运行（如 EAV Server：`curl http://localhost:3000/health`）

## 执行命令

```bash
# 从 workspace 根目录执行
node zero-test/skills/zero-test-skill/test-runner-simple.js \
  <test-file.http> \
  <output-dir> \
  <report-name>
```

**参数说明**：

| 参数 | 说明 | 示例 |
|-----|------|------|
| `<test-file.http>` | `.http` 测试文件路径 | `module-student-profile/tests/student-profile-tests.http` |
| `<output-dir>` | 报告输出目录（自动创建） | `module-student-profile/tests/output` |
| `<report-name>` | 报告文件名（不含扩展名） | `student-profile-test-report` |

**输出**：
- 控制台实时显示：`✓ PASS` / `✗ FAIL` + HTTP 状态码 + 耗时
- 自动保存 Markdown 报告：`<output-dir>/<report-name>.md`（见 [test-report-skill](../test-report-skill/SKILL.md)）

## .http 文件格式

### 文件变量定义

```http
@baseUrl = http://localhost:3000/api
@contentType = application/json
@testId = 202401001
```

- 以 `@` 开头，支持在请求 URL、Header、Body 中用 `{{varName}}` 引用
- 多个 `{{var}}` 全部被替换（支持同一行多个变量）

### 测试用例分隔符

```http
### 测试用例标题（显示在报告中）
```

以 `###` 开头的注释行作为测试用例的标题。每个 `###` 块对应一个测试用例。

### 支持的 HTTP 方法

```http
### 获取资源列表
GET {{baseUrl}}/v1/students?page=1&page_size=20

### 创建资源
POST {{baseUrl}}/v1/students
Content-Type: {{contentType}}

{
  "name": "张三",
  "phone": "13800138000"
}

### 更新资源（全量）
PUT {{baseUrl}}/v1/students/{{testId}}
Content-Type: application/json

{ "name": "张三（更新）" }

### 部分更新资源
PATCH {{baseUrl}}/v1/students/{{testId}}
Content-Type: application/json

{ "phone": "13900139000" }

### 删除资源
DELETE {{baseUrl}}/v1/students/{{testId}}
```

**支持的方法**：GET、POST、PUT、PATCH、DELETE（大小写均可）

### 请求头

```http
GET {{baseUrl}}/v1/students
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
# Authorization: Bearer <PASTE_YOUR_JWT_TOKEN_HERE>
```

- `#` 开头的行为注释，不作为请求头发送
- `Authorization: Bearer {{token}}` 若变量存在会自动注入

### 用例与用例之间的分隔

```http
### 用例一
GET {{baseUrl}}/v1/students

###

### 用例二
POST {{baseUrl}}/v1/students
Content-Type: application/json

{ "name": "李四" }
```

- 空 `###` 或空行均可分隔用例

## 控制台输出示例

```
============================================================
Zero-Test Runner (Simple Version)
============================================================
Test File:    module-student-profile/tests/student-profile-tests.http
Output Dir:   module-student-profile/tests/output
Report Name:  student-profile-test-report
============================================================

Found 38 test cases

Running tests...
------------------------------------------------------------
[1] ✓ PASS - EAV_SETUP_01 — 健康检查 (200 OK, 12ms)
[2] ✓ PASS - EAV_SETUP_02 — 查看路由映射 (200 OK, 8ms)
[3] ✗ FAIL - D001_TC_001_01 — 创建学生 (0 Connection Error)
...
------------------------------------------------------------

Test Execution Summary
============================================================
Total Tests:   38
Passed:        25
Failed:        13
Skipped:       1
Duration:      2.34s
Pass Rate:     65.8%
============================================================

Markdown report saved: module-student-profile/tests/output/student-profile-test-report.md
```

## 判定规则

| 结果 | 条件 |
|-----|------|
| PASS | HTTP 状态码 2xx |
| FAIL | HTTP 状态码非 2xx，或连接失败（0 Connection Error），或 URL 解析失败 |
| SKIP | `.http` 文件中用例解析为空（无 HTTP 方法行） |

## 常见错误处理

| 错误 | 原因 | 解决方法 |
|-----|------|---------|
| `Connection Error` | 目标服务未运行 | 启动 API 服务 |
| `Invalid URL` | 变量未替换（`{{var}}` 残留） | 检查 `@var = value` 定义是否在文件顶部 |
| `Module not found: axios` | npm 依赖未安装 | `cd zero-test && npm install` |
| PATCH 用例被跳过 | 旧版 parser 不支持 PATCH | 已在 `scripts/parser.js` 修复，更新代码 |

## 与其他 skill 的关系

- **输出报告**：执行后自动生成 Markdown 报告，详见 [test-report-skill](../test-report-skill/SKILL.md)
- **PDF 转换**：将 Markdown 报告转为 PDF，详见 [render-pdf-mdpdf](../render-pdf-mdpdf/SKILL.md)
- **调用场景**：在 [api-task-skill](../../../saas-skills/saas-e2e-design/api-task-skill/SKILL.md) Phase 6/7 中被调用

## 典型使用示例（student-profile 领域）

```bash
# 1. 确认 EAV 服务运行
curl http://localhost:3000/health

# 2. 执行测试
node zero-test/skills/zero-test-skill/test-runner-simple.js \
  edu-design/module-student-profile/tests/student-profile-tests.http \
  edu-design/module-student-profile/tests/output \
  student-profile-test-report

# 3. 查看报告（Markdown）
# edu-design/module-student-profile/tests/output/student-profile-test-report.md

# 4. 转换为 PDF（需绝对路径）
$WORKSPACE = (Get-Location).Path
node zero-test/skills/render-pdf-mdpdf/scripts/render.js \
  "$WORKSPACE/edu-design/module-student-profile/tests/output/student-profile-test-report.md" \
  "$WORKSPACE/edu-design/module-student-profile/tests/output/student-profile-test-report.pdf"
```
