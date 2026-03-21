#!/usr/bin/env node
/**
 * Enhanced Test Runner with PDF Output using mdpdf
 * Generates MD report, converts to PDF using render-pdf-mdpdf skill
 * Best for professional rendering with custom CSS styles
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');
const { generateMarkdown, getDefaultStylesheet } = require('./scripts/reporter');

// Import from independent render-pdf-mdpdf skill
const { convertMarkdownToPDF, getConverterInfo } = require('../render-pdf-mdpdf/scripts/pdf-converter');

/**
 * Get user's home directory
 */
function getHomeDir() {
    return process.env.HOME || process.env.USERPROFILE || path.resolve('.');
}

/**
 * Open file with default application
 */
function openFile(filePath) {
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
        command = 'start';
    } else if (platform === 'darwin') {
        command = 'open';
    } else {
        command = 'xdg-open';
    }

    spawn(command, [filePath], {
        detached: true,
        stdio: 'ignore',
        shell: true
    });
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: node test-render-pdf-mdpdf.js <test-file> <md-output-dir> <report-name> [--pdf-output-dir]');
        console.error('');
        console.error('Arguments:');
        console.error('  test-file        Path to .http test file');
        console.error('  md-output-dir    Directory for markdown report');
        console.error('  report-name      Name of report (without extension)');
        console.error('  --pdf-output-dir (optional) Directory for PDF (default: ~/Downloads)');
        process.exit(1);
    }

    const [testFile, mdOutputDir, reportName, ...rest] = args;

    // Parse optional PDF output directory
    let pdfOutputDir = path.join(getHomeDir(), 'Downloads');
    const pdfDirIndex = rest.indexOf('--pdf-output-dir');
    if (pdfDirIndex !== -1 && rest[pdfDirIndex + 1]) {
        pdfOutputDir = rest[pdfDirIndex + 1];
    }

    // Resolve paths
    const testFilePath = path.resolve(testFile);
    const mdOutputDirPath = path.resolve(mdOutputDir);
    const pdfOutputDirPath = path.resolve(pdfOutputDir);

    const mdReportPath = path.join(mdOutputDirPath, `${reportName}.md`);
    const pdfReportPath = path.join(pdfOutputDirPath, `${reportName}.pdf`);

    // Show PDF converter info
    const converterInfo = getConverterInfo();

    console.log('============================================================');
    console.log('Zero-Test PDF Runner (mdpdf)');
    console.log('============================================================');
    console.log(`Test File:     ${testFilePath}`);
    console.log(`MD Output:     ${mdReportPath}`);
    console.log(`PDF Output:    ${pdfReportPath}`);
    console.log('============================================================');
    console.log(`PDF Converter: ${converterInfo.name}`);
    console.log(`Available:     ${converterInfo.available ? '✓ Yes' : '✗ No'}`);
    if (converterInfo.available) {
        console.log('Features:');
        converterInfo.features.forEach(f => console.log(`  • ${f}`));
    }
    console.log('============================================================');
    console.log('');

    if (!converterInfo.available) {
        console.error('Error: mdpdf is not installed!');
        console.error('');
        console.error('Install it with: npm install mdpdf');
        console.error('Note: First run may download Chromium (150-300MB)');
        console.error('');
        console.error('For faster download in China, set:');
        console.error('  set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots');
        process.exit(1);
    }

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
        console.error(`Error: Test file not found: ${testFilePath}`);
        process.exit(1);
    }

    // Ensure output directories exist
    if (!fs.existsSync(mdOutputDirPath)) {
        fs.mkdirSync(mdOutputDirPath, { recursive: true });
    }
    if (!fs.existsSync(pdfOutputDirPath)) {
        fs.mkdirSync(pdfOutputDirPath, { recursive: true });
    }

    // Read and parse test file
    console.log('Reading test file...');
    const testContent = fs.readFileSync(testFilePath, 'utf-8');

    console.log('Parsing test file...');
    const parser = new HttpParser();
    const tests = parser.parseHttpContent(testContent);

    const testCount = Object.keys(tests).filter(k => k !== 'current').length;
    console.log(`Found ${testCount} test cases`);
    console.log('');

    // Run tests
    console.log('Running tests...');
    console.log('------------------------------------------------------------');

    const startTime = Date.now();
    const summary = await runTests(tests, {
        force: true,
        onTestComplete: async (result, index) => {
            const status = result.success ? '✓ PASS' : '✗ FAIL';
            const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
            const resetColor = '\x1b[0m';
            console.log(`${statusColor}[${index}]${resetColor} ${status} - ${result.title} (${result.status} ${result.statusText})`);
        }
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('------------------------------------------------------------');
    console.log('');
    console.log('Test Execution Summary');
    console.log('============================================================');
    console.log(`Total Tests:   ${summary.total}`);
    console.log(`Passed:        ${summary.passed}`);
    console.log(`Failed:        ${summary.failed}`);
    console.log(`Skipped:       ${summary.skipped}`);
    console.log(`Duration:      ${duration}s`);
    console.log(`Pass Rate:     ${summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0}%`);
    console.log('============================================================');
    console.log('');

    // Generate markdown report
    console.log('Generating markdown report...');
    const markdown = generateMarkdown(summary);
    fs.writeFileSync(mdReportPath, markdown, 'utf-8');
    console.log(`✓ Markdown saved: ${mdReportPath}`);
    console.log('');

    // Convert to PDF
    console.log('Converting to PDF with mdpdf...');
    console.log('(This may take a moment on first run as Chromium downloads...)');
    try {
        await convertMarkdownToPDF(mdReportPath, pdfReportPath, {
            // You can pass custom CSS options here
            // mdpdfOptions: { ... }
        });
        console.log(`✓ PDF saved: ${pdfReportPath}`);

        // Show file size
        const stats = fs.statSync(pdfReportPath);
        console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);

        // Auto-open PDF
        console.log('');
        console.log('Opening PDF...');
        openFile(pdfReportPath);

    } catch (error) {
        console.error('✗ PDF conversion failed:', error.message);
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Make sure Chromium is downloaded');
        console.log('2. Check your network connection');
        console.log('3. For China users, set download mirror:');
        console.log('   set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots');
        console.log('');
        console.log('Markdown report is available at:', mdReportPath);
        process.exit(1);
    }

    console.log('');
    console.log('============================================================');
    console.log('Complete!');
    console.log('============================================================');

    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };
