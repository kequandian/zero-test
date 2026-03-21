#!/usr/bin/env node
/**
 * Zero-Test Runner
 * Main test execution script for .http test files
 *
 * Usage:
 *   node test-runner.js <test-file> <output-dir> <report-name> [stylesheet]
 *
 * Example:
 *   node test-runner.js ../../public/testcase/eav-api-test.http ../../output test-report
 */

const fs = require('fs');
const path = require('path');

// Import skill modules
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');
const { saveReport, getDefaultStylesheet } = require('./scripts/reporter');

/**
 * Main execution function
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error('Usage: node test-runner.js <test-file> <output-dir> <report-name> [stylesheet]');
        console.error('');
        console.error('Arguments:');
        console.error('  test-file    Path to .http test file');
        console.error('  output-dir   Output directory for reports');
        console.error('  report-name  Name of the report file (without extension)');
        console.error('  stylesheet   (optional) Path to CSS stylesheet for PDF');
        console.error('');
        console.error('Example:');
        console.error('  node test-runner.js tests.api http ../../output test-report');
        process.exit(1);
    }

    const [testFile, outputDir, reportName, stylesheet] = args;

    // Resolve paths
    const testFilePath = path.resolve(testFile);
    const outputDirPath = path.resolve(outputDir);
    const stylesheetPath = stylesheet ? path.resolve(stylesheet) : getDefaultStylesheet(__dirname);

    console.log('='.repeat(60));
    console.log('Zero-Test Runner');
    console.log('='.repeat(60));
    console.log(`Test File:    ${testFilePath}`);
    console.log(`Output Dir:   ${outputDirPath}`);
    console.log(`Report Name:  ${reportName}`);
    console.log(`Stylesheet:   ${stylesheetPath}`);
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

    // Generate reports
    console.log('Generating reports...');

    try {
        const paths = await saveReport(summary, outputDirPath, reportName, stylesheetPath);

        console.log('Reports generated successfully:');
        console.log(`  Markdown: ${paths.markdown}`);
        console.log(`  PDF:      ${paths.pdf}`);
        console.log('');

        // Exit with appropriate code
        process.exit(summary.failed > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error generating reports:', error.message);
        console.error('');

        // Try to at least save markdown
        try {
            const { generateMarkdown } = require('./scripts/reporter');
            const markdown = generateMarkdown(summary);
            const markdownPath = path.join(outputDirPath, `${reportName}.md`);

            // Ensure output directory exists
            if (!fs.existsSync(outputDirPath)) {
                fs.mkdirSync(outputDirPath, { recursive: true });
            }

            fs.writeFileSync(markdownPath, markdown, 'utf-8');
            console.log(`Markdown report saved: ${markdownPath}`);
        } catch (mdError) {
            console.error('Could not save markdown report:', mdError.message);
        }

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
