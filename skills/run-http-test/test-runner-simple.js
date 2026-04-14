#!/usr/bin/env node
/**
 * Zero-Test Runner (Simple Version - No PDF)
 * Main test execution script for .http test files
 *
 * Usage:
 *   node test-runner-simple.js <test-file> [output-dir] [report-name] [--filter <filters>]
 *
 * Arguments:
 *   test-file    Path to .http test file (required)
 *   output-dir   Output directory for reports (optional, default: ./output/ relative to .http file)
 *   report-name  Name of the report file (optional, default: same as .http filename)
 *   --filter     Run only tests whose title contains the specified filter(s) (optional)
 *                Supports comma-separated: --filter=TC-001,TC-005
 *                Supports range expression: --filter=TC-001:TC-005 (expands to TC-001 through TC-005)
 *                Multiple filters use OR logic: runs tests matching ANY filter
 */

const fs = require('fs');
const path = require('path');

// Import skill modules
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');

/**
 * Pretty-print request body for markdown (JSON if parseable, else raw)
 */
function formatRequestBodyForMarkdown(body) {
    if (body == null) return null;
    const s = String(body).trim();
    if (!s) return null;
    try {
        return JSON.stringify(JSON.parse(s), null, 2);
    } catch {
        return s;
    }
}

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

        const reqBodyMd = formatRequestBodyForMarkdown(result.requestBody);
        if (reqBodyMd) {
            lines.push('**Request body:**');
            lines.push('```json');
            lines.push(reqBodyMd);
            lines.push('```');
            lines.push('');
        }

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

        // Show extracted variables in report
        if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
            lines.push('');
            lines.push('**🔧 Extracted Variables:**');
            lines.push('');
            for (const [varName, value] of Object.entries(result.extractedVars)) {
                const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
                lines.push(`- \`${varName}\`: \`${displayValue}\``);
            }
            lines.push('');
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
 * Parse command line arguments
 * Supports both positional and --filter option
 */
function parseArguments(args) {
    const result = {
        testFile: null,
        outputDir: null,
        reportName: null,
        filter: null
    };

    let i = 0;
    while (i < args.length) {
        // Handle --filter=value format (equals sign)
        if (args[i].startsWith('--filter=')) {
            result.filter = args[i].substring(9); // Remove '--filter=' prefix
            i++;
        }
        // Handle --filter value format (space-separated)
        else if (args[i] === '--filter' && i + 1 < args.length) {
            result.filter = args[i + 1];
            i += 2;
        } else if (!result.testFile) {
            result.testFile = args[i];
            i++;
        } else if (!result.outputDir) {
            result.outputDir = args[i];
            i++;
        } else if (!result.reportName) {
            result.reportName = args[i];
            i++;
        } else {
            i++;
        }
    }

    return result;
}

/**
 * Main execution function
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error('Usage: node test-runner-simple.js <test-file> [output-dir] [report-name] [--filter <filters>]');
        console.error('');
        console.error('Arguments:');
        console.error('  test-file    Path to .http test file (required)');
        console.error('  output-dir   Output directory for reports (optional, default: ./output/ relative to .http file)');
        console.error('  report-name  Name of the report file (optional, default: same as .http filename)');
        console.error('  --filter     Run only tests whose title contains the specified filter(s) (optional)');
        console.error('               Supports comma-separated: --filter=TC-001,TC-005');
        console.error('               Supports range expression: --filter=TC-001:TC-005 (expands to 001-005)');
        console.error('               Multiple filters use OR logic: runs tests matching ANY filter');
        console.error('');
        console.error('Examples:');
        console.error('  node test-runner-simple.js tests/api-test.http');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output custom-report');
        console.error('  node test-runner-simple.js tests/api-test.http --filter TC-001');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output custom-report --filter 创建用户');
        console.error('  node test-runner-simple.js tests/api-test.http --filter TC-001,TC-005,TC-010');
        console.error('  node test-runner-simple.js tests/api-test.http --filter TC-001:TC-010  (range)');
        console.error('  node test-runner-simple.js tests/api-test.http --filter TC-001:TC-005,TC-008  (mixed)');
        process.exit(1);
    }

    const { testFile, outputDir, reportName, filter } = parseArguments(args);

    // Resolve paths
    const testFilePath = path.resolve(testFile);

    // Default output-dir to ./output/ relative to the .http file's directory
    let outputDirPath;
    if (outputDir) {
        outputDirPath = path.resolve(outputDir);
    } else {
        const testFileDir = path.dirname(testFilePath);
        outputDirPath = path.join(testFileDir, 'output');
    }

    // Default report-name to the .http filename without extension
    const defaultReportName = path.basename(testFilePath, path.extname(testFilePath));
    const finalReportName = reportName || defaultReportName;
    const reportPath = path.join(outputDirPath, `${finalReportName}.md`);

    console.log('='.repeat(60));
    console.log('Zero-Test Runner (Simple Version)');
    console.log('='.repeat(60));
    console.log(`Test File:    ${testFilePath}`);
    console.log(`Output Dir:   ${outputDirPath}`);
    console.log(`Report Name:  ${finalReportName}`);
    if (filter) {
        console.log(`Filter:       ${filter}`);
    }
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

    // Get initial variables for runtime context
    const initialVars = parser.getInitialVars();
    console.log(`Initial variables: ${Object.keys(initialVars).join(', ') || 'none'}`);

    const testCount = Object.keys(tests).filter(k => k !== 'current').length;
    console.log(`Found ${testCount} test cases`);
    console.log('');

    // Run tests
    console.log('Running tests...');
    console.log('-'.repeat(60));

    const startTime = Date.now();
    const summary = await runTests(tests, {
        force: true,
        initialVars: initialVars,
        filter: filter,
        onTestComplete: async (result, index) => {
            const status = result.success ? '✓ PASS' : '✗ FAIL';
            const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
            const resetColor = '\x1b[0m';

            // Show extracted variables in console output
            let extractInfo = '';
            if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
                const extracts = Object.entries(result.extractedVars)
                    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(', ');
                extractInfo = ` [Extracted: ${extracts}]`;
            }

            console.log(`${statusColor}[${index}]${resetColor} ${status} - ${result.title} (${result.status} ${result.statusText})${extractInfo}`);
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
