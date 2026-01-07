/**
 * Test Runner
 * Executes parsed test cases and collects results
 */

const { sendRequest, isSuccessful, formatResponse } = require('./http');

/**
 * Run a single test case
 * @param {object} test - Test case object
 * @returns {Promise<object>} Test result
 */
async function runTest(test) {
    const result = {
        title: test.key || 'Untitled Test',
        method: test.method,
        url: test.request,
        success: false,
        status: 0,
        statusText: '',
        response: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await sendRequest(
            test.method,
            test.request,
            {
                body: test.body,
                token: test.token
            }
        );

        result.success = isSuccessful(response);
        result.status = response.status;
        result.statusText = response.statusText;
        result.response = response.data;
        result.error = response.error;

        return result;
    } catch (error) {
        result.error = error.message;
        return result;
    }
}

/**
 * Run multiple test cases
 * @param {object} tests - Parsed test cases object
 * @param {object} options - Execution options
 * @param {boolean} options.force - Continue on errors
 * @param {function} options.onTestComplete - Callback after each test
 * @returns {Promise<object>} Test run summary
 */
async function runTests(tests, options = {}) {
    const {
        force = true,
        onTestComplete = null
    } = options;

    const results = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Get test keys (excluding 'current' if exists)
    const testKeys = Object.keys(tests).filter(k => k !== 'current');

    for (const key of testKeys) {
        const test = tests[key];

        // Skip tests with 'terminated' status
        if (test.status === 'terminated') {
            skipped++;
            continue;
        }

        // Only run tests that are properly closed
        if (test.status !== 'closed' && test.status !== 'titled_closed') {
            skipped++;
            continue;
        }

        const result = await runTest(test);
        results.push(result);

        if (result.success) {
            passed++;
        } else {
            failed++;
        }

        // Call callback if provided
        if (onTestComplete) {
            await onTestComplete(result, results.length);
        }

        // Stop on first error if not forcing
        if (!force && !result.success) {
            break;
        }
    }

    return {
        total: testKeys.length - skipped,
        passed,
        failed,
        skipped,
        results
    };
}

/**
 * Format test result for markdown output
 * @param {object} result - Test result object
 * @returns {string} Markdown formatted string
 */
function formatTestResult(result) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const lines = [];

    lines.push(`### ${status} - ${result.title}`);
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

    return lines.join('\n');
}

/**
 * Format test summary for markdown output
 * @param {object} summary - Test run summary
 * @returns {string} Markdown formatted string
 */
function formatSummary(summary) {
    const lines = [];

    lines.push('# Test Summary');
    lines.push('');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total | ${summary.total} |`);
    lines.push(`| Passed | ${summary.passed} |`);
    lines.push(`| Failed | ${summary.failed} |`);
    lines.push(`| Skipped | ${summary.skipped} |`);

    if (summary.total > 0) {
        const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
        lines.push(`| Pass Rate | ${passRate}% |`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    return lines.join('\n');
}

module.exports = {
    runTest,
    runTests,
    formatTestResult,
    formatSummary
};
