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
        extractedVars: {} // Track extracted variables
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

        result.success = isSuccessful(response);
        result.status = response.status;
        result.statusText = response.statusText;
        result.response = response.data;
        result.error = response.error;

        // EXTRACT VARIABLES from response
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
        return result;
    }
}

/**
 * Extract test case number from title (e.g., "TC-001 Get Users" -> 1)
 * @param {string} title - Test case title
 * @returns {number|null} Extracted number or null if not found
 */
function extractTestNumber(title) {
    // Match patterns like "TC-001", "TEST-123", "TC001", etc.
    const match = title.match(/[A-Z]+-?(\d+)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

/**
 * Check if a test key matches a filter pattern
 * Supports both substring matching and numeric range matching
 * @param {string} testKey - Test case key/title
 * @param {string} filter - Filter pattern
 * @returns {boolean} True if the test matches the filter
 */
function testMatchesFilter(testKey, filter) {
    const testLower = testKey.toLowerCase();
    const filterLower = filter.toLowerCase();

    // Direct substring match
    if (testLower.includes(filterLower)) {
        return true;
    }

    // Try numeric matching for patterns like TC-001, TC001, etc.
    const testNum = extractTestNumber(testKey);
    const filterNum = extractTestNumber(filter);

    if (testNum !== null && filterNum !== null && testNum === filterNum) {
        return true;
    }

    return false;
}

/**
 * Expand filter range expression (e.g., "TC-001:TC-005" -> ["TC-001", "TC-002", ..., "TC-005"])
 * Handles different number formats (TC-1:TC-5, TC-001:TC-005) intelligently
 * @param {string} filter - Filter expression that may contain range
 * @returns {Array<string>} Array of expanded filter patterns
 */
function expandFilterRange(filter) {
    // Check for pattern like "TC-001:TC-005" or "TC-1:TC-5"
    const patternMatch = filter.match(/^(.+?)-(\d+):(.+?)-(\d+)$/);
    if (patternMatch) {
        const prefix = patternMatch[1];
        const startNumStr = patternMatch[2];
        const endPrefix = patternMatch[3];
        const endNumStr = patternMatch[4];
        const startNum = parseInt(startNumStr, 10);
        const endNum = parseInt(endNumStr, 10);

        // Verify prefixes match and numbers are valid
        if (prefix === endPrefix && !isNaN(startNum) && !isNaN(endNum)) {
            const expanded = [];
            const min = Math.min(startNum, endNum);
            const max = Math.max(startNum, endNum);

            // Use the max padding length from start/end numbers
            const maxPadding = Math.max(startNumStr.length, endNumStr.length);

            for (let i = min; i <= max; i++) {
                // Generate pattern with original padding format
                const numStr = String(i).padStart(maxPadding, '0');
                expanded.push(`${prefix}-${numStr}`);
            }
            return expanded;
        }
    }
    return [filter]; // No range, return original filter
}

/**
 * Parse and expand filter expressions
 * Supports comma-separated values and range expressions
 * @param {string} filter - Filter expression(s)
 * @returns {Array<string>} Array of expanded filter patterns
 */
function parseFilters(filter) {
    if (!filter) return [];

    // Split by comma and process each part
    const parts = filter.split(',').map(f => f.trim()).filter(f => f);
    const expanded = [];

    for (const part of parts) {
        // Check if this part is a range expression (contains :)
        if (part.includes(':')) {
            expanded.push(...expandFilterRange(part));
        } else {
            expanded.push(part);
        }
    }

    return expanded;
}

/**
 * Run multiple test cases with shared variable context
 * @param {object} tests - Parsed test cases object
 * @param {object} options - Execution options
 * @param {boolean} options.force - Continue on errors
 * @param {function} options.onTestComplete - Callback after each test
 * @param {object} options.initialVars - Initial variables from parser
 * @param {string} options.filter - Run only tests whose title contains this substring (supports comma-separated and range expressions)
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

    // Apply filter if provided (supports comma-separated and range expressions)
    if (filter) {
        // Parse and expand filter expressions
        const filters = parseFilters(filter);

        testKeys = testKeys.filter(k => {
            // Match if ANY of the filters match the test key (OR logic)
            // If a filter pattern matches no tests, it's silently skipped
            return filters.some(f => testMatchesFilter(k, f));
        });
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
    formatSummary
};
