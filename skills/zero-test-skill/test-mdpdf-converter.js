#!/usr/bin/env node
/**
 * Test mdpdf converter with custom styles
 */

const path = require('path');
const { convertMarkdownStringToPDF, getConverterInfo } = require('./scripts/pdf-converter-mdpdf');

async function test() {
    console.log('=== Testing mdpdf Converter ===\n');

    // Show converter info
    const info = getConverterInfo();
    console.log('Converter:', info.name);
    console.log('Available:', info.available ? '✓' : '✗');
    console.log('');
    console.log('Features:');
    info.features.forEach(f => console.log(`  • ${f}`));
    console.log('');

    if (!info.available) {
        console.error('mdpdf is not installed!');
        console.log('Install with: npm install mdpdf');
        process.exit(1);
    }

    // Create test markdown with various features
    const testMarkdown = `# PDF 渲染测试报告

## 测试概述

本文档用于测试 mdpdf 的渲染效果，包括**中文支持**、*样式格式化*、\`代码块\`等特性。

## 格式化测试

### 文本样式

这是**粗体文本**，这是*斜体文本*，这是***粗斜体文本***。

### 行内代码

在行中使用 \`const\` 声明常量，使用 \`let\` 声明变量。

### 链接

访问 [GitHub](https://github.com) 了解更多信息。

## 代码块测试

### JavaScript 代码

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
    return true;
}

// 调用函数
greet('世界');
\`\`\`

### JSON 数据

\`\`\`json
{
    "name": "测试",
    "value": 123,
    "active": true,
    "items": ["a", "b", "c"]
}
\`\`\`

## 列表测试

### 无序列表

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

### 有序列表

1. 首先执行此步骤
2. 然后执行下一步
3. 最后完成

## 表格测试

| 名称 | 类型 | 状态 | 描述 |
|------|------|------|------|
| 用户 A | 管理员 | 活跃 | 系统管理员账户 |
| 用户 B | 普通用户 | 活跃 | 标准用户权限 |
| 用户 C | 访客 | 禁用 | 待审核账户 |

## 引用块

> 这是一段引用文本。
> 可以跨越多行。
>
> — 作者名

## 分隔线

---

## 混合内容测试

测试**粗体**和*斜体*以及\`代码\`的组合。同时测试[链接](https://example.com)在段落中的效果。

## 性能测试结果

| 指标 | 数值 |
|------|------|
| 响应时间 | 45ms |
| 吞吐量 | 1000 req/s |
| 错误率 | 0.01% |

## 结论

mdpdf 提供了专业的 PDF 渲染效果，支持自定义 CSS 样式，是生成高质量测试报告的理想选择。

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;

    // Create output directory
    const testDir = path.join(__dirname, 'output');
    const fs = require('fs');

    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const pdfPath = path.join(testDir, 'test-mdpdf-output.pdf');

    console.log('Converting markdown to PDF...');
    console.log('');

    try {
        await convertMarkdownStringToPDF(testMarkdown, pdfPath, {
            // You can customize CSS here
            // css: '.body { font-family: "SimSun"; }'
        });

        console.log('✓ PDF generated successfully!');
        console.log('Output:', pdfPath);
        console.log('');

        // Open PDF
        const { spawn } = require('child_process');
        const platform = process.platform;
        let command;

        if (platform === 'win32') {
            command = 'start';
        } else if (platform === 'darwin') {
            command = 'open';
        } else {
            command = 'xdg-open';
        }

        console.log('Opening PDF...');
        spawn(command, [pdfPath], {
            detached: true,
            stdio: 'ignore',
            shell: true
        });

    } catch (error) {
        console.error('✗ Conversion failed:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Make sure Chromium is downloaded (may take time on first run)');
        console.error('2. Check your network connection');
        console.error('3. Try setting Puppeteer download mirror:');
        console.error('   set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots');
        process.exit(1);
    }
}

test();
