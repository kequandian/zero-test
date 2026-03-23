---
name: test-report-skill
description: 生成 Markdown 格式 HTTP 测试报告的技能。将 HTTP 测试执行结果（PASS/FAIL 统计、每条用例的请求 URL、状态码、响应体、错误详情）格式化为结构化 Markdown 文件，供人工审阅或进一步转换为 PDF 报告。
---

# test-report-skill

将 HTTP 测试执行结果生成结构化 Markdown 测试报告。

## 触发条件

当需要：
- 查看 `.http` 测试执行后的结构化报告
- 了解 Markdown 报告的内容格式和字段含义
- 自定义或扩展报告内容
- 将报告进一步转换为 PDF

## 报告生成方式

Markdown 报告**由 `test-runner-simple.js` 在测试执行结束时自动生成**，无需单独命令。执行以下命令即可同时获得测试结果和报告：

```bash
node zero-test/skills/zero-test-skill/test-runner-simple.js \
  <test-file.http> \
  <output-dir> \
  <report-name>
```

报告输出路径：`<output-dir>/<report-name>.md`

> 如需执行细节，参见 [run-http-skill](../run-http-skill/SKILL.md)

## Markdown 报告结构

### 1. 报告头部 — 汇总统计

```markdown
# 📊 Test Report

## 📋 Summary

| Metric        | Value                  |
|---------------|------------------------|
| **Date**      | 2026-03-21 15:30:00    |
| **Total Tests**   | 38                 |
| **✅ Passed** | 25                     |
| **❌ Failed** | 13                     |
| **⏭️ Skipped**| 1                      |
| **Pass Rate** | ❌ **65.8%**           |

**⏱️ Duration:** 2.34 seconds
```

**字段说明**：

| 字段 | 含义 |
|-----|------|
| Total Tests | 解析到的测试用例总数（含 Skipped） |
| Passed | HTTP 状态码 2xx 的用例数 |
| Failed | 非 2xx 或连接失败的用例数 |
| Skipped | 未发出请求的用例（解析为空或无方法行） |
| Pass Rate | Passed / Total × 100%，100% 时显示 ✅，否则 ❌ |
| Duration | 所有请求总耗时（秒） |

### 2. 测试详情 — 每条用例

每条用例输出以下信息：

```markdown
### ✅ D001_TC_001_01 — 创建学生（成功）

| Property     | Value       |
|--------------|-------------|
| **Status**   | PASSED      |
| **Method**   | `POST`      |
| **Status Code** | `201`    |
| **Duration** | 45 ms       |
| **Timestamp**| `2026-03-21T15:30:01.123Z` |

**🔗 Request URL:**
```
http://localhost:3000/api/v1/students
```

**📥 Response:**
```json
{
  "data": {
    "id": "202401001",
    "name": "张三",
    "phone": "13800138000"
  }
}
```
```

失败用例额外显示错误信息：

```markdown
### ❌ D001_TC_001_01 — 创建学生（成功）

...

**❌ Error Details:**
```
Connection refused: http://localhost:3000/api/v1/students
```
```

### 3. 每条用例字段说明

| 字段 | 说明 |
|-----|------|
| Status | PASSED / FAILED |
| Method | HTTP 方法（GET/POST/PUT/PATCH/DELETE） |
| Status Code | 实际收到的 HTTP 状态码（连接失败为 0） |
| Duration | 单条请求耗时（毫秒） |
| Timestamp | 请求发出时间（ISO 8601） |
| Request URL | 变量替换后的完整 URL |
| Response | 响应体（JSON 格式化，超过 2000 字符截断） |
| Error Details | 仅失败用例显示，包含错误描述 |

## 报告文件位置

```
<output-dir>/
└── <report-name>.md      ← Markdown 报告（由 test-runner 生成）
```

示例：
```
edu-design/module-student-profile/tests/output/
└── student-profile-test-report.md
```

## 核心模块：scripts/reporter.js

报告由 `zero-test/skills/zero-test-skill/scripts/reporter.js` 生成。主要函数：

| 函数 | 说明 |
|-----|------|
| `generateMarkdown(summary)` | 将测试汇总对象生成完整 Markdown 字符串 |
| `formatTestResultEnhanced(result)` | 格式化单条测试结果为 Markdown 块 |
| `formatSummary(summary)` | 生成汇总统计表（含状态徽章） |
| `saveReport(summary, outputDir, reportName)` | 保存 Markdown 文件到磁盘 |

### 扩展报告内容

如需在报告中增加自定义字段，修改 `reporter.js` 中的 `formatTestResultEnhanced`：

```javascript
// 在 formatTestResultEnhanced 中添加自定义字段
lines.push(`| **Domain** | ${result.domain || '-'} |`);
lines.push(`| **Test Case ID** | ${result.testCaseId || '-'} |`);
```

### 传入 summary 对象结构

```javascript
{
  total: 38,
  passed: 25,
  failed: 13,
  skipped: 1,
  duration: "2.34",
  results: [
    {
      title: "D001_TC_001_01 — 创建学生",
      method: "POST",
      url: "http://localhost:3000/api/v1/students",
      success: true,
      status: 201,
      statusText: "Created",
      response: "{\"data\":{...}}",
      error: null,
      duration: 45,
      timestamp: "2026-03-21T15:30:01.123Z"
    },
    ...
  ]
}
```

## 将 Markdown 报告转换为 PDF

生成 Markdown 后，使用 [render-pdf-mdpdf skill](../render-pdf-mdpdf/SKILL.md) 转为 PDF：

```bash
# 必须使用绝对路径
$WORKSPACE = (Get-Location).Path    # PowerShell
# export WORKSPACE=$(pwd)           # bash

node zero-test/skills/render-pdf-mdpdf/scripts/render.js \
  "$WORKSPACE/<output-dir>/<report-name>.md" \
  "$WORKSPACE/<output-dir>/<report-name>.pdf"
```

**注意**：`render.js` 要求绝对路径，相对路径会导致 `ERR_FILE_NOT_FOUND`。

## 三个 skill 的协作关系

```
.http 测试文件
    │
    ▼
run-http-skill          → 执行 HTTP 请求，输出 PASS/FAIL 控制台
    │ 自动生成
    ▼
test-report-skill       → Markdown 报告（tests/output/*.md）
    │ 手动触发
    ▼
render-pdf-mdpdf        → PDF 报告（tests/output/*.pdf）
```

## 与 api-task-skill 的对应关系

| api-task-skill 阶段 | 使用的 skill |
|--------------------|------------|
| Phase 6：执行测试，修正循环 | [run-http-skill](../run-http-skill/SKILL.md) |
| Phase 7：生成测试报告 | [run-http-skill](../run-http-skill/SKILL.md)（自动生成 .md）+ 本 skill（理解报告） |
| Phase 8：生成 PDF | [render-pdf-mdpdf](../render-pdf-mdpdf/SKILL.md) |
