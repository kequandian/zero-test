# Markdown to PDF 渲染优化计划

## 最终方案

### 方案 A: mdpdf ✅ **推荐使用**

**状态:** 已完成并验证

**优点:**
- ✅ 完整的 HTML/CSS 渲染
- ✅ 自定义 CSS 样式表
- ✅ 中文字体支持优秀
- ✅ 专业的 GitHub 风格排版
- ✅ 支持页眉页脚配置
- ✅ 已测试验证

**缺点:**
- ⚠️ 首次运行需要下载 Chromium (150-300MB)

**使用方法:**
```bash
cd skills/zero-test-skill
node test-render-pdf-mdpdf.js <test-file> <md-output-dir> <report-name>
```

**文档:** [PDF-MDPDF-IMPLEMENTATION.md](PDF-MDPDF-IMPLEMENTATION.md)

---

## 方案评估总结

| 方案 | 名称 | 状态 | 结果 |
|------|------|------|------|
| **A** | mdpdf | ✅ 已实施 | ⭐⭐⭐⭐⭐ **推荐** |
| **B** | markdown2pdf-mcp | ❌ 不可用 | 非 npm 包 |
| **C** | Typst + markdown-it | ❌ 已废弃 | 效果不佳 |
| **D** | @joshuakb2/mdpdf | ℹ️ 重复 | 与 A 相同 |
| **E** | md-to-pdf | ⚠️ 安装失败 | 无法评估 |

---

## 方案详情

### 方案 B: markdown2pdf-mcp ❌

- npm 上无此包
- LobeHub Skill 专属
- **建议:** 使用方案 A

### 方案 C: Typst + markdown-it ❌ 已废弃

- 功能完整但渲染效果不理想
- **已移除所有相关代码和文档**

### 方案 D: @joshuakb2/mdpdf ℹ️

- 与方案 A 是同一个包
- mdpdf 已支持页眉页脚

### 方案 E: md-to-pdf ❌ 不可用

- npm 安装问题，模块无法加载
- 可能已停止维护或与 Node.js v22 不兼容
- **建议:** 放弃此方案

---

## 安装指南

### 标准安装

```bash
npm install mdpdf
```

### 中国大陆镜像加速

```bash
set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots
npm install mdpdf
```

---

## 文档

- [PDF-MDPDF-IMPLEMENTATION.md](PDF-MDPDF-IMPLEMENTATION.md) - 实施详情
- [PDF-SOLUTIONS-EVALUATION.md](PDF-SOLUTIONS-EVALUATION.md) - 完整评估

---

## 参考资源

- [mdpdf NPM](https://www.npmjs.com/package/mdpdf)
- [mdpdf GitHub](https://github.com/BlueHatbRit/mdpdf)
- [md-to-pdf GitHub](https://github.com/xionkq/md-to-pdf)
