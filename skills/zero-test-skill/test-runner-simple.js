#!/usr/bin/env node
/**
 * Zero-Test Runner (Simple Version - No PDF)
 * Main test execution script for .http test files
 *
 * Usage:
 *   node test-runner-simple.js <test-file> [output-dir] [report-name] [--filter <substring>]
 *
 * Arguments:
 *   test-file    Path to .http test file (required)
 *   output-dir   Output directory for reports (optional, default: ./output/ relative to .http file)
 *   report-name  Name of the report file (optional, default: same as .http filename)
 *   --filter     Run only tests whose title contains the specified substring (optional)
 *                Supports both formats: --filter VALUE or --filter=VALUE
 */

const fs = require('fs');
const path = require('path');

// Import skill modules
const HttpParser = require('./scripts/parser');
const { runTests, analyzeFailures, analyzeDependencies } = require('./scripts/runner');

/**
 * Generate markdown report (without PDF)
 */
function generateMarkdownReport(summary, reportPath, filter = null) {
    const lines = [];

    lines.push('# Test Report');
    lines.push('');

    // Add filter info if present
    if (filter) {
        lines.push(`**🔍 Filter:** ${filter}`);
        lines.push('');
        lines.push('*This report only shows test cases matching the filter.*');
        lines.push('');
    }

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

    // Add failure analysis if there are failures
    if (summary.failed > 0) {
        const failureAnalysis = analyzeFailures(summary.results);

        lines.push('## ❌ Failure Analysis');
        lines.push('');

        // Group by status code
        if (Object.keys(failureAnalysis.byStatusCode).length > 0) {
            lines.push('### By Status Code');
            lines.push('');
            for (const [status, tests] of Object.entries(failureAnalysis.byStatusCode).sort((a, b) => {
                const statusA = parseInt(a[0]) || 0;
                const statusB = parseInt(b[0]) || 0;
                return statusB - statusA; // Sort descending
            })) {
                lines.push(`**${status}** (${tests.length} test${tests.length > 1 ? 's' : ''})`);
                for (const test of tests) {
                    lines.push(`  - ${test}`);
                }
                lines.push('');
            }
        }

        // Group by failure reason
        if (Object.keys(failureAnalysis.byReason).length > 0) {
            lines.push('### By Failure Reason');
            lines.push('');
            for (const [reason, tests] of Object.entries(failureAnalysis.byReason).sort((a, b) => {
                return b[1].length - a[1].length; // Sort by count descending
            })) {
                lines.push(`**${reason}** (${tests.length} test${tests.length > 1 ? 's' : ''})`);
                for (const test of tests) {
                    lines.push(`  - ${test}`);
                }
                lines.push('');
            }
        }

        // Group by method
        if (Object.keys(failureAnalysis.byMethod).length > 0) {
            lines.push('### By HTTP Method');
            lines.push('');
            for (const [method, info] of Object.entries(failureAnalysis.byMethod)) {
                lines.push(`**${method}**: ${info.fail} failed`);
            }
            lines.push('');
        }

        lines.push('---');
        lines.push('');
    }

    // Add dependency analysis
    const dependencyAnalysis = analyzeDependencies({}, summary.results);
    if (dependencyAnalysis.chains.length > 0) {
        lines.push('## 🔗 Test Dependencies');
        lines.push('');
        lines.push('The following extracted variables are used across tests:');
        lines.push('');
        for (const dep of dependencyAnalysis.chains) {
            lines.push(`- **\`${dep.variable}\`**: Defined in *${dep.source}* → Used in:`);
            for (const consumer of dep.consumers) {
                lines.push(`  - ${consumer}`);
            }
            lines.push('');
        }
        lines.push('---');
        lines.push('');
    }

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

        // Show expected status if set
        if (result.expectedStatus) {
            const { min, max } = result.expectedStatus;
            const expected = min === max ? min : `${min}-${max}`;
            lines.push(`**Expected Status:** ${expected}`);
        }

        lines.push(`**Time:** ${result.timestamp}`);
        lines.push('');

        // Show failure reason if failed
        if (!result.success && result.failureReason) {
            lines.push(`**⚠️ Failure Reason:** ${result.failureReason}`);
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
        const arg = args[i];

        // Handle --filter=value format
        if (arg.startsWith('--filter=')) {
            result.filter = arg.substring(9); // Remove '--filter=' prefix
            i++;
        }
        // Handle --filter value format
        else if (arg === '--filter' && i + 1 < args.length) {
            result.filter = args[i + 1];
            i += 2;
        }
        // Handle positional arguments
        else if (!result.testFile) {
            result.testFile = arg;
            i++;
        } else if (!result.outputDir) {
            result.outputDir = arg;
            i++;
        } else if (!result.reportName) {
            result.reportName = arg;
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
        console.error('Usage: node test-runner-simple.js <test-file> [output-dir] [report-name] [--filter <substring>]');
        console.error('');
        console.error('Arguments:');
        console.error('  test-file    Path to .http test file (required)');
        console.error('  output-dir   Output directory for reports (optional, default: ./output/ relative to .http file)');
        console.error('  report-name  Name of the report file (optional, default: same as .http filename)');
        console.error('  --filter     Run only tests whose title contains the specified substring (optional)');
        console.error('               Supports both formats: --filter VALUE or --filter=VALUE');
        console.error('');
        console.error('Examples:');
        console.error('  node test-runner-simple.js tests/api-test.http');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output custom-report');
        console.error('  node test-runner-simple.js tests/api-test.http --filter TC-001');
        console.error('  node test-runner-simple.js tests/api-test.http --filter=TC-001');
        console.error('  node test-runner-simple.js tests/api-test.http custom-output custom-report --filter 创建用户');
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

    const allTestCount = Object.keys(tests).filter(k => k !== 'current').length;

    // Count tests that match the filter
    let filteredTestCount = allTestCount;
    if (filter) {
        const filterLower = filter.toLowerCase();
        filteredTestCount = Object.keys(tests).filter(k =>
            k !== 'current' &&
            k.toLowerCase().includes(filterLower)
        ).length;
    }

    if (filter) {
        console.log(`Found ${allTestCount} total test cases, ${filteredTestCount} matching filter "${filter}"`);
    } else {
        console.log(`Found ${allTestCount} test cases`);
    }
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
            const dimColor = '\x1b[90m';
            const boldColor = '\x1b[1m';

            // Build the base output line
            let outputLine = `${statusColor}${boldColor}[${index}]${resetColor} ${status} - ${result.title}`;

            // Show status with color coding
            if (result.status >= 200 && result.status < 300) {
                outputLine += ` (\x1b[32m${result.status}\x1b[0m`;
            } else if (result.status >= 400 && result.status < 500) {
                outputLine += ` (\x1b[33m${result.status}\x1b[0m`;
            } else if (result.status >= 500) {
                outputLine += ` (\x1b[31m${result.status}\x1b[0m`;
            } else if (result.status === 0) {
                outputLine += ` (\x1b[90mCONN ERROR\x1b[0m`;
            } else {
                outputLine += ` (${result.status}`;
            }

            // Show expected status if different from actual
            if (result.expectedStatus) {
                const { min, max } = result.expectedStatus;
                const expected = min === max ? min : `${min}-${max}`;
                if (result.status < min || result.status > max) {
                    outputLine += `, \x1b[36mexpected ${expected}\x1b[0m`;
                }
            }

            outputLine += ')';

            // Show failure reason for failed tests
            if (!result.success && result.failureReason) {
                outputLine += `\n${dimColor}       Reason: ${result.failureReason}${resetColor}`;
            }

            // Show extracted variables in console output
            if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
                const extracts = Object.entries(result.extractedVars)
                    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(', ');
                outputLine += `\n${dimColor}       Extracted: ${extracts}${resetColor}`;
            }

            console.log(outputLine);
        }
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('-'.repeat(60));
    console.log('');
    console.log('Test Execution Summary');
    console.log('='.repeat(60));

    // Color-coded summary
    const passColor = summary.passed > 0 ? '\x1b[32m' : '\x1b[90m';
    const failColor = summary.failed > 0 ? '\x1b[31m' : '\x1b[90m';
    const resetColor = '\x1b[0m';

    console.log(`Total Tests:   ${summary.total}`);
    console.log(`${passColor}Passed:        ${summary.passed}${resetColor}`);
    console.log(`${failColor}Failed:        ${summary.failed}${resetColor}`);
    console.log(`Skipped:       ${summary.skipped}`);
    console.log(`Duration:      ${duration}s`);

    const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
    const passRateColor = passRate >= 80 ? '\x1b[32m' : passRate >= 50 ? '\x1b[33m' : '\x1b[31m';
    console.log(`${passRateColor}Pass Rate:     ${passRate}%${resetColor}`);
    console.log('='.repeat(60));

    // Show failure analysis if there are failures
    if (summary.failed > 0) {
        console.log('');
        console.log('❌ Failure Analysis:');
        console.log('-'.repeat(60));

        const failureAnalysis = analyzeFailures(summary.results);

        // Group by status code
        console.log('');
        console.log('By Status Code:');
        for (const [status, tests] of Object.entries(failureAnalysis.byStatusCode).sort((a, b) => {
            const statusA = parseInt(a[0]) || 0;
            const statusB = parseInt(b[0]) || 0;
            return statusB - statusA;
        })) {
            const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[90m';
            console.log(`  ${statusColor}${status}${resetColor} (${tests.length} test${tests.length > 1 ? 's' : ''})`);
        }

        // Group by failure reason
        console.log('');
        console.log('By Failure Reason:');
        for (const [reason, tests] of Object.entries(failureAnalysis.byReason).sort((a, b) => {
            return b[1].length - a[1].length;
        })) {
            console.log(`  • ${reason} (${tests.length})`);
        }

        console.log('');
        console.log('-'.repeat(60));
    }

    console.log('');

    // Generate markdown report
    console.log('Generating markdown report...');

    try {
        const markdownPath = generateMarkdownReport(summary, reportPath, filter);
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
