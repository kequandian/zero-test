---
name: gen-http-test
description: >-
  Guides authoring JetBrains-style .http API collections for the run-http-test runner (zero-test)
  to maximize pass rate: idempotent data, pre-cleanup, extract paths, expect-status, filter/dependency
  behavior, and ordering rules. Use when creating or refactoring src/test/http/*.http files, when the
  user asks for high-pass-rate API tests, or when integrating with run-http-test.
---

# 编写高通过率 `.http` 测试（gen-http-test）

面向 **`run-http-test`**（`zero-test/skills/run-http-test`）执行的 `.http` 文件，总结可复用约定。生成或修改 `*.http` 时优先遵循本文。

---

## 1. 文件头：环境与可重复性

- **`@host` / `@base` / `@token`**：集中定义；`token` 用占位符，本地替换真实值。
- **避免硬编码冲突**：为 `code`、`subDir`、业务唯一键增加 **`@suffix` 或日期后缀**（如 `brand-a-20260416`），并在注释中说明「改后缀可换一套数据」。
- **不要依赖 JetBrains 动态变量**（如 `{{$randomInt}}`）：当前 runner **不解析**。
- **`@` 变量非递归展开**：避免 `@a = {{b}}` 再嵌套多层；需要时用 **`# @extract`** 在运行时写入 context。

---

## 2. 用例编号与结构

- **稳定 ID**：`### TC-001: 简述`，与报告、过滤 `--filter TC-001` 对齐。
- **预清理段**：在「主创建」之前增加 **`TC-000-preA`～`preH`**（或按域拆分）：先 **GET 列表/分页** 再 **DELETE**。与业务注释写清：**为何用 `subDir` 而不仅是 `code`**（过滤与唯一约束）。
- **分段**：`### ===...===` 分隔 Suite；**收尾清理**（如 `TC-099`）放在文件后部，删除测试创建的数据。
- **顺序**：有父子/外键时，**先子后父的删除**；创建链路 **POST → GET → PUT → DELETE**；**不要在后续仍引用父 ID 时先 DELETE 父资源**。

---

## 3. 变量与 `# @extract`

- **语法**：`# @extract <JSONPath> -> <varName>`，放在**产生该响应的请求块之后**（紧挨下一个 `###` 之前）。
- **路径与 ApiResult 对齐**：成功体多为 `data.xxx`。创建资源常用 **`data.id`**；分页列表用 **`data.records[0].id`**（runner 支持 `[0]` 形式）。
- **后续请求**：URL/body 使用 `{{varName}}`；Authorization 里 `{{token}}` 会参与依赖分析。
- **`@` 别名链**：若 `@path = {{host}}{{base}}/x/{{id}}`，过滤子用例时 runner 会把 **`id`** 的提供用例一并纳入依赖闭包。

---

## 4. 断言：`# @expect-status` / `# @expected`

- **`# @expect-status 200,400`**：允许多个状态码（逗号分隔）。适用于 **可选删除**（无残留时仍可能 400）、或业务重复冲突。
- **`# @expected 400`**：单一精确状态码。
- **`# @expect-body-contains 文案`**：断言响应体包含子串（优先级高于状态码默认逻辑）。
- **语义**：`200,400` 表示「成功或预期内失败都可接受」；与 **仅 2xx 为通过** 的默认规则不同，须在注释里说明场景。

---

## 5. 预清理 + 可选 DELETE（高通过率关键）

典型模式：

1. **GET** `page` + `subDir=...` → `# @extract data.records[0].id -> preDeleteIdX`
2. **DELETE** `/delete/{{preDeleteIdX}}` → `# @expect-status 200,400`

当列表 **为空** 时，**没有 `records[0]`**，extract **不会**写入变量；配合 **run-http-test** 时，若写了 `200,400`，runner 可将未解析的 id 占位符按约定处理为可发请求。编写时仍应：

- 为 DELETE 写上 **`# @expect-status 200,400`**（必要时含 **404**，视 API 而定）；
- 在注释中说明「无残留时允许 4xx」。

---

## 6. `run-http-test` CLI 习惯

- **过滤多个 ID**：推荐 **`--filter TC-001,TC-033`**（逗号后**不要空格**），或 **`--filter TC-001 --filter TC-033`**。
- **逗号后有空格**（如 `TC-001, TC-033`）在 shell 里可能被拆参数；若必须用空格，**整段加引号**。
- **依赖**：对子串过滤时，runner 会按 **`{{变量}}` + `# @extract`** 自动拉上**前置用例**；若主流程含 **TC-001**，还会自动带上文件中 **TC-001 之前的 `TC-000-pre*`**（避免重复键导致创建失败）。
- **报告**：成功响应多为 `ApiResult`，extract 使用 **`data.*`**，与 crud-design 约定一致。

---

## 7. 检查清单（生成后自查）

| 项 | 说明 |
|----|------|
| 唯一性 | `code`/`subDir`/业务键是否随 `@suffix` 可变 |
| 顺序 | 创建是否先于依赖其 ID 的用例；清理是否在最后 |
| 提取路径 | 是否与真实 JSON 一致（含 `data` 包裹） |
| 可选删除 | 无记录场景是否声明 `expect-status`（含 4xx） |
| 注释 | 预清理、Suite、过滤字段（如 subDir）是否说明动机 |

---

## 8. 最小示例骨架

```http
@host = http://localhost:8080
@base = /api/.../resource
@token = Bearer replace_me
@suffix = 20260417
@code = entity-a-{{suffix}}

### TC-000-pre: 清理可能残留（按唯一键查询后删）
GET {{host}}{{base}}/page?pageSize=1&code={{code}}
Authorization: {{token}}

# @extract data.records[0].id -> preId

### TC-000-pre: 删除残留（如存在）
DELETE {{host}}{{base}}/delete/{{preId}}
Authorization: {{token}}

# @expect-status 200,400,404

### TC-001: 创建
POST {{host}}{{base}}
Authorization: {{token}}
Content-Type: application/json

{ "code": "{{code}}", "name": "t" }

# @extract data.id -> entityId

### TC-002: 查询
GET {{host}}{{base}}/get/{{entityId}}
Authorization: {{token}}
```

---

## 相关技能与路径

- **执行**：`~/workspace/clis/zero-test/skills/run-http-test`（`test-runner-simple.js`、`scripts/runner.js`）
- **语法补充**：同仓库 `run-http-test/references/SYNTAX.md`

生成新文件时，将本 skill 与 **run-http-test** 的判定规则一起遵守，可显著减少「变量未解析、重复键 400、过滤漏依赖」类失败。
