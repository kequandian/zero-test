#!/usr/bin/env node
/**
 * CLI Render Script for render-pdf-mdpdf Skill
 * Convert Markdown to PDF with optional customization
 */

const fs = require('fs');
const path = require('path');
const { convertMarkdownToPDF, convertMarkdownStringToPDF } = require('./pdf-converter');

/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const result = {
        input: null,
        output: null,
        css: null,
        header: null,
        footer: null,
        help: false,
        string: null
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            result.help = true;
        } else if (arg === '--css' && args[i + 1]) {
            result.css = args[++i];
        } else if (arg === '--header' && args[i + 1]) {
            result.header = args[++i];
        } else if (arg === '--footer' && args[i + 1]) {
            result.footer = args[++i];
        } else if (arg === '--string' && args[i + 1]) {
            result.string = args[++i];
        } else if (!result.input) {
            result.input = arg;
        } else if (!result.output) {
            result.output = arg;
        }
    }

    return result;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
render-pdf-mdpdf - Markdown to PDF Converter

USAGE:
  node scripts/render.js <input> <output> [options]

ARGUMENTS:
  input              Input markdown file path (or use --string for direct input)
  output             Output PDF file path

OPTIONS:
  --css <path>       Custom CSS file path
  --header <text>    Page header text (use %p for page number, %d for date)
  --footer <text>    Page footer text
  --string <markdown> Convert markdown string directly (instead of file)
  --help, -h         Show this help message

EXAMPLES:
  # Convert markdown file to PDF
  node scripts/render.js README.md README.pdf

  # With custom CSS
  node scripts/render.js doc.md doc.pdf --css assets/custom.css

  # Convert string directly
  node scripts/render.js --string "# Hello" output.pdf

  # With header and footer
  node scripts/render.js doc.md doc.pdf --header "Page %p" --footer "Confidential"

CSS CUSTOMIZATION:
  See references/CSS-CUSTOMIZATION.md for detailed CSS guide

SUPPORTED FEATURES:
  - Headers (H1-H6), bold, italic, inline code
  - Code blocks with syntax highlighting
  - Lists (ordered/unordered, nested)
  - Tables with alignment
  - Blockquotes, horizontal rules
  - Links, images
  - Excellent Chinese font support
`);
}

/**
 * Main execution
 */
async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help || !args.output) {
        showHelp();
        process.exit(args.help ? 0 : 1);
    }

    const options = {};

    // Add custom CSS
    if (args.css) {
        if (fs.existsSync(args.css)) {
            options.css = args.css;
        } else {
            console.error(`Error: CSS file not found: ${args.css}`);
            process.exit(1);
        }
    }

    // Add header/footer
    if (args.header || args.footer) {
        options.mdpdfOptions = {};
        if (args.header) {
            options.mdpdfOptions.header = args.header;
        }
        if (args.footer) {
            options.mdpdfOptions.footer = args.footer;
        }
    }

    console.log('============================================================');
    console.log('render-pdf-mdpdf - Markdown to PDF Converter');
    console.log('============================================================');
    console.log(`Output: ${args.output}`);
    if (args.string) {
        console.log(`Input: (string, ${args.string.length} characters)`);
    } else {
        console.log(`Input: ${args.input}`);
    }
    if (args.css) {
        console.log(`CSS: ${args.css}`);
    }
    console.log('============================================================');
    console.log('');

    try {
        const startTime = Date.now();

        if (args.string) {
            // Convert string directly
            console.log('Converting markdown string to PDF...');
            await convertMarkdownStringToPDF(args.string, args.output, options);
        } else {
            // Convert file
            if (!args.input || !fs.existsSync(args.input)) {
                console.error(`Error: Input file not found: ${args.input}`);
                process.exit(1);
            }
            console.log('Converting markdown file to PDF...');
            await convertMarkdownToPDF(args.input, args.output, options);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Get file size
        const stats = fs.statSync(args.output);
        const sizeKB = (stats.size / 1024).toFixed(2);

        console.log('');
        console.log('✓ PDF generated successfully!');
        console.log(`  File: ${args.output}`);
        console.log(`  Size: ${sizeKB} KB`);
        console.log(`  Time: ${duration}s`);
        console.log('');

    } catch (error) {
        console.error('');
        console.error('✗ Conversion failed:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Make sure mdpdf is installed: npm install mdpdf');
        console.error('2. For China users, set mirror:');
        console.error('   set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots');
        console.error('3. Check your CSS file path and syntax');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };
