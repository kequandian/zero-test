/**
 * Test Runner
 * Executes parsed test cases and collects results
 *
 * Enhanced with dynamic variable extraction:
 * - Runtime context management
 * - JIT variable compilation
 * - Response extraction with JSONPath support
 */

// Try to use axios, fall back to native implementation
let httpModule;
try {
    httpModule = require('./http');
} catch (e) {
    console.warn('axios not available, using native HTTP module');
    httpModule = require('./http-native');
}

const { sendRequest, isSuccessful, formatResponse } = httpModule;

/**
 * Get value from object using JSONPath-like notation
 * Supports dot notation: data.row_id, user.profile.name
 */
function getValueByPath(obj, path) {
    if (!path) return undefined;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}

/**
 * Substitute variables in template string with context values
 * @param {string} template - String with {{variable}} placeholders
 * @param {object} context - Variable context object
 * @returns {string} String with variables replaced
 */
function substituteVariables(template, context) {
    if (!template) return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const trimmedVarName = varName.trim();
        if (context[trimmedVarName] !== undefined) {
            return context[trimmedVarName];
        }
        // Keep original if variable not found
        return match;
    });
}

/**
 * Run a single test case
 * @param {object} test - Test case object
 * @param {object} context - Runtime variable context
 * @returns {Promise<object>} Test result with extracted variables
 */
async function runTest(test, context = {}) {
    // Clean up title: remove ### prefix and trim whitespace
    const rawTitle = test.key || 'Untitled Test';
    const cleanTitle = rawTitle.replace(/^#+\s*/, '').trim();

    const result = {
        title: cleanTitle,
        method: test.method,
        url: test.request,
        success: false,
        status: 0,
        statusText: '',
        response: null,
        error: null,
        timestamp: new Date().toISOString(),
        extractedVars: {}, // Track extracted variables
        failureReason: null, // Enhanced failure analysis
        expectedStatus: test.expectedStatus || null // Track expected status
    };

    try {
        // JIT COMPILATION: Substitute variables at runtime
        const compiledUrl = substituteVariables(test.request, context);
        const compiledBody = test.body ? substituteVariables(test.body, context) : undefined;

        // Handle token with lazy binding
        let token = test.token; // Old way (already substituted)
        if (test.tokenVar && context[test.tokenVar]) {
            token = context[test.tokenVar];
        }

        result.url = compiledUrl; // Store compiled URL for reporting

        const response = await sendRequest(
            test.method,
            compiledUrl,
            {
                body: compiledBody,
                token: token
            }
        );

        result.status = response.status;
        result.statusText = response.statusText;
        result.response = response.data;
        result.error = response.error;

        // SUCCESS DETERMINATION with enhanced validation
        let isSuccess = false;
        let failureReason = null;

        // Check expected status range first (highest priority)
        if (test.expectedStatus) {
            const { min, max } = test.expectedStatus;
            if (response.status >= min && response.status <= max) {
                isSuccess = true;
            } else {
                failureReason = `Expected status ${min}-${max}, got ${response.status}`;
            }
        } else if (isSuccessful(response)) {
            // Fall back to default success check
            isSuccess = true;
        } else {
            // Default failure reason
            if (response.status >= 400 && response.status < 500) {
                failureReason = `Client error ${response.status}: ${response.statusText}`;
            } else if (response.status >= 500) {
                failureReason = `Server error ${response.status}: ${response.statusText}`;
            } else if (response.status === 0) {
                failureReason = response.error || 'Connection failed';
            } else {
                failureReason = `Unexpected status ${response.status}`;
            }
        }

        // Check for API-level error codes (even with 2xx HTTP status)
        if (isSuccess && response.data) {
            const apiCode = response.data.code;
            const apiMsg = response.data.msg || response.data.message;

            // Common API error patterns
            if (apiCode !== undefined && apiCode !== null && apiCode !== 200 && apiCode !== 0) {
                isSuccess = false;
                failureReason = `API error code ${apiCode}${apiMsg ? ': ' + apiMsg : ''}`;
            }
        }

        result.success = isSuccess;
        result.failureReason = failureReason;

        // EXTRACT VARIABLES from response (only if success or if extraction is still useful)
        if (test.extractors && test.extractors.length > 0 && response.data) {
            for (const extractor of test.extractors) {
                const value = getValueByPath(response.data, extractor.path);
                if (value !== undefined) {
                    context[extractor.targetVar] = value;
                    result.extractedVars[extractor.targetVar] = value;
                }
            }
        }

        return result;
    } catch (error) {
        result.error = error.message;
        result.failureReason = `Exception: ${error.message}`;
        return result;
    }
}

/**
 * Run multiple test cases with shared variable context
 * @param {object} tests - Parsed test cases object
 * @param {object} options - Execution options
 * @param {boolean} options.force - Continue on errors
 * @param {function} options.onTestComplete - Callback after each test
 * @param {object} options.initialVars - Initial variables from parser
 * @param {string} options.filter - Run only tests whose title contains this substring
 * @returns {Promise<object>} Test run summary
 */
async function runTests(tests, options = {}) {
    const {
        force = true,
        onTestComplete = null,
        initialVars = {},
        filter = null
    } = options;

    const results = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Initialize runtime context with initial variables
    const context = { ...initialVars };

    // Get test keys (excluding 'current' if exists)
    let testKeys = Object.keys(tests).filter(k => k !== 'current');

    // Apply filter if provided
    if (filter) {
        const filterLower = filter.toLowerCase();
        testKeys = testKeys.filter(k => k.toLowerCase().includes(filterLower));
    }

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

        // Run test with shared context
        const result = await runTest(test, context);
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
 * Analyze failures and group by type
 * @param {array} results - Test results array
 * @returns {object} Failure analysis grouped by type
 */
function analyzeFailures(results) {
    const analysis = {
        byStatusCode: {},
        byReason: {},
        byMethod: {},
        total: 0,
        details: []
    };

    for (const result of results) {
        if (result.success) continue;

        analysis.total++;

        // Group by HTTP status code
        const statusKey = result.status || 'CONNECTION_ERROR';
        if (!analysis.byStatusCode[statusKey]) {
            analysis.byStatusCode[statusKey] = [];
        }
        analysis.byStatusCode[statusKey].push(result.title);

        // Group by failure reason
        let reasonKey = result.failureReason || 'Unknown';
        // Simplify reason for grouping
        if (reasonKey.startsWith('Server error')) {
            reasonKey = 'Server Error (5xx)';
        } else if (reasonKey.startsWith('Client error')) {
            reasonKey = 'Client Error (4xx)';
        } else if (reasonKey.startsWith('API error')) {
            reasonKey = 'API Error Code';
        } else if (reasonKey.startsWith('Expected status')) {
            reasonKey = 'Unexpected Status';
        }

        if (!analysis.byReason[reasonKey]) {
            analysis.byReason[reasonKey] = [];
        }
        analysis.byReason[reasonKey].push(result.title);

        // Group by method
        const methodKey = result.method || 'UNKNOWN';
        if (!analysis.byMethod[methodKey]) {
            analysis.byMethod[methodKey] = { fail: 0, tests: [] };
        }
        analysis.byMethod[methodKey].fail++;
        analysis.byMethod[methodKey].tests.push(result.title);

        // Store details for report
        analysis.details.push({
            title: result.title,
            status: result.status,
            reason: result.failureReason,
            method: result.method,
            url: result.url
        });
    }

    return analysis;
}

/**
 * Find test dependencies (extracted variables usage)
 * @param {object} tests - Parsed test cases
 * @param {array} results - Test results
 * @returns {object} Dependency information
 */
function analyzeDependencies(tests, results) {
    const dependencies = [];
    const varUsage = {};

    // Build variable usage map
    for (const result of results) {
        if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
            for (const varName of Object.keys(result.extractedVars)) {
                if (!varUsage[varName]) {
                    varUsage[varName] = {
                        definedIn: result.title,
                        usedIn: []
                    };
                }
            }
        }
    }

    // Find which tests use which variables
    for (const result of results) {
        const url = result.url || '';
        const matches = url.match(/\{\{([^}]+)\}\}/g) || [];

        for (const match of matches) {
            const varName = match.replace(/\{\{|\}\}/g, '').trim();
            if (varUsage[varName] && varUsage[varName].definedIn !== result.title) {
                varUsage[varName].usedIn.push(result.title);
            }
        }
    }

    // Build dependency chains
    for (const [varName, info] of Object.entries(varUsage)) {
        if (info.usedIn.length > 0) {
            dependencies.push({
                variable: varName,
                source: info.definedIn,
                consumers: info.usedIn
            });
        }
    }

    return {
        variables: varUsage,
        chains: dependencies
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

    // Show extracted variables
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
    formatSummary,
    analyzeFailures,
    analyzeDependencies
};
