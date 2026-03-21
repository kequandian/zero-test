# CSS Customization Guide

This guide explains how to customize the PDF output using CSS.

## Quick Start

Create a CSS file and use it:

```bash
node scripts/render.js input.md output.pdf --css your-style.css
```

## CSS Selectors Reference

### Basic Elements

| Selector | Description | Example |
|----------|-------------|---------|
| `body` | Main content area | Font family, size, line height |
| `p` | Paragraphs | Spacing, alignment |
| `a` | Links | Color, decoration |
| `strong` | Bold text | Weight, color |
| `em` | Italic text | Style, color |

### Headers

| Selector | Description |
|----------|-------------|
| `h1, h2, h3, h4, h5, h6` | All headers |
| `h1` | Main title |
| `h2` | Section headers |
| `h3` | Subsection headers |

### Code

| Selector | Description |
|----------|-------------|
| `code` | Inline code |
| `pre` | Code blocks |
| `pre code` | Code within blocks |

### Lists

| Selector | Description |
|----------|-------------|
| `ul` | Unordered lists |
| `ol` | Ordered lists |
| `li` | List items |

### Tables

| Selector | Description |
|----------|-------------|
| `table` | Table element |
| `th` | Header cells |
| `td` | Data cells |
| `tr` | Table rows |
| `tr:nth-child(even)` | Even rows |

### Other Elements

| Selector | Description |
|----------|-------------|
| `blockquote` | Quote blocks |
| `hr` | Horizontal rules |
| `img` | Images |

## Common Customizations

### 1. Change Font

```css
body {
    font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
    font-size: 11pt;
}
```

### 2. Change Header Colors

```css
h1 {
    color: #3498db;
    border-bottom: 2px solid #3498db;
}

h2 {
    color: #2980b9;
    border-bottom: 1px solid #2980b9;
}
```

### 3. Style Code Blocks (Dark Theme)

```css
pre {
    background-color: #282c34;
    color: #abb2bf;
    border-radius: 6px;
    padding: 16px;
}

code {
    background-color: #f4f4f4;
    color: #e74c3c;
    padding: 0.2em 0.4em;
    border-radius: 3px;
}
```

### 4. Style Tables

```css
table {
    border-collapse: collapse;
    width: 100%;
}

th {
    background-color: #3498db;
    color: white;
    padding: 8px 12px;
}

td {
    padding: 8px 12px;
    border: 1px solid #ddd;
}

tr:nth-child(even) {
    background-color: #f8f9fa;
}
```

### 5. Style Links

```css
a {
    color: #3498db;
    text-decoration: none;
}

a:hover {
    color: #2980b9;
    text-decoration: underline;
}
```

### 6. Style Blockquotes

```css
blockquote {
    border-left: 4px solid #3498db;
    padding-left: 1em;
    color: #6a737d;
    background-color: #f6f8fa;
}
```

### 7. Add Page Breaks

```css
/* Page break before major sections */
h1, h2 {
    page-break-before: always;
}

/* Avoid breaking after headers */
h1, h2, h3 {
    page-break-after: avoid;
}

/* Avoid breaking inside elements */
pre, blockquote, table {
    page-break-inside: avoid;
}
```

## CSS Units

| Unit | Description | Example |
|------|-------------|---------|
| `pt` | Points (absolute) | `font-size: 12pt` |
| `px` | Pixels (absolute) | `padding: 10px` |
| `em` | Relative to font size | `margin: 1em` |
| `%` | Percentage | `width: 100%` |
| `cm` | Centimeters | `margin: 1cm` |
| `in` | Inches | `width: 8.5in` |

## Color Values

| Format | Example | Description |
|--------|---------|-------------|
| Hex | `#3498db` | 6-digit hex color |
| RGB | `rgb(52, 152, 219)` | RGB values |
| RGBA | `rgba(52, 152, 219, 0.5)` | RGB with opacity |
| HSL | `hsl(204, 70%, 53%)` | HSL values |
| Named | `blue` | Color name |

## Tips and Tricks

### 1. Use System Fonts for Chinese

```css
body {
    font-family: "Microsoft YaHei", "SimHei", "PingFang SC", sans-serif;
}
```

### 2. Add Shadows for Depth

```css
table {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

img {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

### 3. Style Horizontal Rules

```css
hr {
    border: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, #ccc, transparent);
}
```

### 4. Rounded Corners

```css
pre, blockquote, code, td, th {
    border-radius: 4px;
}
```

### 5. Hover Effects (for interactive viewing)

```css
a:hover {
    color: #2980b9;
    text-decoration: underline;
}

tr:hover {
    background-color: #f0f0f0;
}
```

## Complete Example

```css
/* Custom PDF Style */

/* Base */
body {
    font-family: "Microsoft YaHei", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 2cm;
}

/* Headers */
h1, h2, h3, h4, h5, h6 {
    color: #2c3e50;
    font-weight: 600;
}

h1 {
    font-size: 2em;
    color: #3498db;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.3em;
}

/* Code */
pre {
    background-color: #282c34;
    color: #abb2bf;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
}

code {
    font-family: "Consolas", monospace;
    background-color: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

/* Tables */
table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
}

th, td {
    padding: 8px 12px;
    border: 1px solid #ddd;
}

th {
    background-color: #3498db;
    color: white;
}

tr:nth-child(even) {
    background-color: #f8f9fa;
}

/* Links */
a {
    color: #3498db;
    text-decoration: none;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #3498db;
    padding-left: 1em;
    color: #6a737d;
}
```

## Testing Your CSS

1. Create a test markdown file with various elements
2. Apply your CSS
3. Review the PDF output
4. Iterate on the CSS

```bash
node scripts/render.js examples/sample.md output.pdf --css your-style.css
```

## Resources

- [CSS Properties Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference)
- [CSS Color Picker](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)
- [CSS Units Guide](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units)
