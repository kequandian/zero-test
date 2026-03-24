#!/usr/bin/env node
/**
 * PDF Converter using mdpdf (Puppeteer-based)
 * Provides full HTML/CSS rendering with custom styles
 * Excellent for Chinese font support and professional styling
 */

const fs = require('fs');
const path = require('path');

// Try to load mdpdf
let mdpdf = null;
try {
    mdpdf = require('mdpdf');
} catch (e) {
    // mdpdf not available
}

/**
 * PDF Converter using mdpdf
 */
class MdpdfConverter {
    constructor() {
        this.available = mdpdf !== null;
        this.cssDir = path.join(__dirname, '../assets');
        this.defaultCssPath = path.join(this.cssDir, 'markdown-pdf.css');
        this.ensureCssFile();
    }

    /**
     * Check if mdpdf is available
     */
    isAvailable() {
        return this.available;
    }

    /**
     * Ensure CSS file exists
     */
    ensureCssFile() {
        if (!fs.existsSync(this.cssDir)) {
            fs.mkdirSync(this.cssDir, { recursive: true });
        }

        if (!fs.existsSync(this.defaultCssPath)) {
            const css = this.getDefaultCss();
            fs.writeFileSync(this.defaultCssPath, css, 'utf-8');
        }
    }

    /**
     * Get default CSS styles
     */
    getDefaultCss() {
        return `
/* Base styles */
body {
    font-family: "Microsoft YaHei", "PingFang SC", "SimHei", "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}

/* Headers */
h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
}

h1 {
    font-size: 2em;
    border-bottom: 2px solid #eaecef;
    padding-bottom: 0.3em;
}

h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
}

h3 {
    font-size: 1.25em;
}

h4 {
    font-size: 1em;
}

/* Paragraphs */
p {
    margin-top: 0;
    margin-bottom: 16px;
}

/* Links */
a {
    color: #0366d6;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

/* Code blocks */
pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    margin-bottom: 16px;
}

code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    padding: 0.2em 0.4em;
}

pre code {
    background-color: transparent;
    padding: 0;
    font-size: 100%;
}

/* Blockquotes */
blockquote {
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    margin-bottom: 16px;
}

/* Lists */
ul, ol {
    padding-left: 2em;
    margin-bottom: 16px;
}

li {
    margin-bottom: 4px;
}

li > p {
    margin-top: 16px;
}

/* Tables */
table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16px;
    display: block;
    overflow-x: auto;
}

th, td {
    padding: 6px 13px;
    border: 1px solid #dfe2e5;
}

th {
    font-weight: 600;
    background-color: #f6f8fa;
}

tr:nth-child(even) {
    background-color: #f6f8fa;
}

/* Horizontal rule */
hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
}

/* Images */
img {
    max-width: 100%;
    height: auto;
}

/* Strong/Bold */
strong {
    font-weight: 600;
}

/* Emphasis/Italic */
em {
    font-style: italic;
}

/* Task list checkboxes */
input[type="checkbox"] {
    margin-right: 0.5em;
}
`;
    }

    /**
     * Convert markdown to PDF
     */
    async convert(markdownPath, pdfPath, options = {}) {
        if (!this.available) {
            throw new Error(
                'mdpdf is not installed.\n' +
                'Install it with: npm install mdpdf\n' +
                'Note: First run may download Chromium (150-300MB)'
            );
        }

        // Use custom CSS file or default
        let cssPath = this.defaultCssPath;

        if (options.css) {
            // If custom CSS string provided, create temp file
            if (options.css.includes('{') || options.css.includes('\n')) {
                const tempCssPath = path.join(this.cssDir, `custom-${Date.now()}.css`);
                fs.writeFileSync(tempCssPath, options.css, 'utf-8');
                cssPath = tempCssPath;
            } else {
                cssPath = options.css;
            }
        }

        // Prepare options for mdpdf
        const mdpdfOptions = {
            source: markdownPath,
            destination: pdfPath,
            styles: cssPath,
            pdf: {
                format: 'A4',
                orientation: 'portrait',
                border: {
                    top: '1cm',
                    right: '1cm',
                    bottom: '1cm',
                    left: '1cm'
                }
            },
            ...options.mdpdfOptions
        };

        // Add header/footer if specified
        if (options.header) {
            mdpdfOptions.header = options.header;
        }

        if (options.footer) {
            mdpdfOptions.footer = options.footer;
        }

        console.log('Converting with mdpdf (Puppeteer rendering)...');

        try {
            await mdpdf.convert(mdpdfOptions);
            console.log('✓ PDF generated with mdpdf');
            return pdfPath;
        } catch (error) {
            throw new Error(`mdpdf conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert markdown string to PDF
     */
    async convertString(markdown, pdfPath, options = {}) {
        // Create temp markdown file
        const tempDir = path.join(path.dirname(pdfPath), '.temp-mdpdf');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempMdPath = path.join(tempDir, `${Date.now()}.md`);
        fs.writeFileSync(tempMdPath, markdown, 'utf-8');

        try {
            await this.convert(tempMdPath, pdfPath, options);
            return pdfPath;
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempMdPath)) {
                fs.unlinkSync(tempMdPath);
            }
        }
    }

    /**
     * Get converter info
     */
    getInfo() {
        return {
            name: 'mdpdf',
            available: this.available,
            description: 'Puppeteer-based PDF converter with full CSS support',
            features: [
                'Full HTML/CSS rendering',
                'Custom CSS styles',
                'Chinese font support',
                'Headers and footers',
                'Page number control'
            ]
        };
    }
}

/**
 * Singleton instance
 */
let instance = null;

function getInstance() {
    if (!instance) {
        instance = new MdpdfConverter();
    }
    return instance;
}

/**
 * Convert markdown to PDF (convenience function)
 */
async function convertMarkdownToPDF(markdownPath, pdfPath, options = {}) {
    const converter = getInstance();
    return await converter.convert(markdownPath, pdfPath, options);
}

/**
 * Convert markdown string to PDF
 */
async function convertMarkdownStringToPDF(markdown, pdfPath, options = {}) {
    const converter = getInstance();
    return await converter.convertString(markdown, pdfPath, options);
}

/**
 * Get converter info
 */
function getConverterInfo() {
    const converter = getInstance();
    return converter.getInfo();
}

module.exports = {
    MdpdfConverter,
    convertMarkdownToPDF,
    convertMarkdownStringToPDF,
    getConverterInfo,
    getInstance
};
