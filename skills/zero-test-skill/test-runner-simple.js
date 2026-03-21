#!/usr/bin/env node
/**
 * Zero-Test Runner (Simple Version - No PDF)
 * Main test execution script for .http test files
 *
 * Usage:
 *   node test-runner-simple.js <test-file> <output-dir> <report-name>
 */

const fs = require('fs');
const path = require('path');

// Import skill modules
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');

/**
 * Generate markdown report (without PDF)
 */
function generateMarkdownReport(summary, reportPath) {
    const lines = [];

    lines.push('# Test Report');
    lines.push('');
    lines.push(`**Date:** ${new Date().toISOString()}`);
    lines.push(`**Total Tests:** ${summary.total}`);
    lines.push(`**Passed:** ${summary.passed}`);
    lines.push(`**Failed:** ${summary.failed}`);
    lines.push(`**Skipped:** ${summary.skipped}`);
    lines.push('');

    if (summary.total > 0) {
        const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
        lines.push(`**Pass Rate:** ${passRate}%`);
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('# Test Details');
    lines.push('');

    // Add test summary table
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Count |');
    lines.push('|--------|-------|');
    lines.push(`| Total | ${summary.total} |`);
    lines.push(`| Passed | ${summary.passed} |`);
    lines.push(`| Failed | ${summary.failed} |`);
    lines.push(`| Skipped | ${summary.skipped} |`);
    lines.push('');

    // Add individual test results
    lines.push('## Test Cases');
    lines.push('');

    for (const result of summary.results) {
        const status = result.success ? '✅' : '❌';
        lines.push(`### ${status} ${result.title}`);
        lines.push('');
        lines.push(`**Method:** ${result.method}`);
        lines.push(`**URL:** ${result.url}`);
        lines.push(`**Status:** ${result.status} ${result.statusText}`);
        lines.push(`**Time:** ${result.timestamp}`);
        lines.push('');

        if (result.response) {
            lines.push('**Response:**');
            lines.push('```json');
            if (typeof result.response === 'object') {
                lines.push(JSON.stringify(result.response, null, 2));
            } else {
                lines.push(String(result.response));
            }
            lines.push('```');
        }

        if (result.error) {
            lines.push('');
            lines.push(`**Error:** ${result.error}`);
        }

        lines.push('');
        lines.push('---');
        lines.push('');
    }

    const markdown = lines.join('\n');

    // Ensure output directory exists
    const outputDir = path.dirname(reportPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write markdown file
    fs.writeFileSync(reportPath, markdown, 'utf-8');

    return reportPath;
}

/**
 * Main execution function
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: node test-runner-simple.js <test-file> <output-dir> <report-name>');
        console.error('');
        console.error('Arguments:');
        console.error('  test-file    Path to .http test file');
        console.error('  output-dir   Output directory for reports');
        console.error('  report-name  Name of the report file (without extension)');
        console.error('');
        console.error('Example:');
        console.error('  node test-runner-simple.js ../../public/testcase/eav-api-test.http ../../output test-report');
        process.exit(1);
    }

    const [testFile, outputDir, reportName] = args;

    // Resolve paths
    const testFilePath = path.resolve(testFile);
    const outputDirPath = path.resolve(outputDir);
    const reportPath = path.join(outputDirPath, `${reportName}.md`);

    console.log('='.repeat(60));
    console.log('Zero-Test Runner (Simple Version)');
    console.log('='.repeat(60));
    console.log(`Test File:    ${testFilePath}`);
    console.log(`Output Dir:   ${outputDirPath}`);
    console.log(`Report Name:  ${reportName}`);
    console.log('='.repeat(60));
    console.log('');

    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
        console.error(`Error: Test file not found: ${testFilePath}`);
        process.exit(1);
    }

    // Read test file
    console.log('Reading test file...');
    const testContent = fs.readFileSync(testFilePath, 'utf-8');

    // Parse test file
    console.log('Parsing test file...');
    const parser = new HttpParser();
    const tests = parser.parseHttpContent(testContent);

    const testCount = Object.keys(tests).filter(k => k !== 'current').length;
    console.log(`Found ${testCount} test cases`);
    console.log('');

    // Run tests
    console.log('Running tests...');
    console.log('-'.repeat(60));

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

    console.log('-'.repeat(60));
    console.log('');
    console.log('Test Execution Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests:   ${summary.total}`);
    console.log(`Passed:        ${summary.passed}`);
    console.log(`Failed:        ${summary.failed}`);
    console.log(`Skipped:       ${summary.skipped}`);
    console.log(`Duration:      ${duration}s`);
    console.log(`Pass Rate:     ${summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0}%`);
    console.log('='.repeat(60));
    console.log('');

    // Generate markdown report
    console.log('Generating markdown report...');

    try {
        const markdownPath = generateMarkdownReport(summary, reportPath);
        console.log(`Markdown report saved: ${markdownPath}`);
        console.log('');

        // Exit with appropriate code
        process.exit(summary.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error generating report:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run main function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };
