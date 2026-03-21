# render-pdf-mdpdf Skill

独立的 Markdown to PDF 转换 Skill，使用 mdpdf (Puppeteer-based) 实现。

## 快速开始

```bash
# 进入 skill 目录
cd skills/render-pdf-mdpdf

# 运行测试
node test-render.js

# 转换 markdown 到 PDF
node scripts/render.js examples/sample.md output/sample.pdf

# 使用自定义 CSS
node scripts/render.js examples/sample.md output/sample.pdf --css examples/custom-style.css
```

## 目录结构

```
render-pdf-mdpdf/
├── SKILL.md                        # Skill 文档
├── README.md                       # 本文件
├── test-render.js                  # 测试脚本
├── scripts/
│   ├── pdf-converter.js            # PDF 转换器模块
│   └── render.js                   # CLI 渲染脚本
├── assets/
│   └── markdown-pdf.css            # 默认 GitHub 风格 CSS
├── examples/
│   ├── sample.md                   # 示例 markdown
│   └── custom-style.css            # 自定义样式示例
├── references/
│   └── CSS-CUSTOMIZATION.md        # CSS 自定义指南
└── output/                         # 输出目录
    ├── sample-basic.pdf
    ├── sample-custom.pdf
    └── sample-string.pdf
```

## 集成到 zero-test-skill

zero-test-skill 通过以下方式引用此 skill：

```javascript
// 在 zero-test-skill/test-render-pdf-mdpdf.js 中
const { convertMarkdownToPDF, getConverterInfo } = require('../render-pdf-mdpdf/scripts/pdf-converter');
```

## 特性

- ✅ 完整的 HTML/CSS 渲染
- ✅ 自定义 CSS 样式
- ✅ 优秀的中文字体支持
- ✅ GitHub 风格的专业排版
- ✅ 支持页眉页脚配置
- ✅ 代码块语法高亮

## 测试结果

所有测试通过：
- ✓ 基础转换 (sample-basic.pdf, 3873 KB, 3.86s)
- ✓ 自定义 CSS (sample-custom.pdf, 3934 KB, 4.01s)
- ✓ 字符串转换 (sample-string.pdf, 17 KB, 2.63s)

## 依赖

```json
{
  "mdpdf": "^2.1.2"
}
```

## 文档

- [SKILL.md](SKILL.md) - 完整 Skill 文档
- [references/CSS-CUSTOMIZATION.md](references/CSS-CUSTOMIZATION.md) - CSS 自定义指南
