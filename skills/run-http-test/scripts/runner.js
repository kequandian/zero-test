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
 * Check if an HTTP status code matches an expect-status pattern.
 * Supports exact codes (e.g. "400") and range wildcards (e.g. "4xx").
 * @param {number} status - Actual HTTP status code
 * @param {string} pattern - Comma-separated patterns like "400,409,422" or "4xx"
 * @returns {boolean}
 */
function statusMatches(status, pattern) {
    if (!pattern) return false;
    const parts = pattern.split(',').map(p => p.trim()).filter(Boolean);
    return parts.some(part => {
        if (/^\dxx$/i.test(part)) {
            const prefix = parseInt(part[0], 10);
            return status >= prefix * 100 && status < (prefix + 1) * 100;
        }
        return String(status) === part;
    });
}

/**
 * Evaluate test success based on expected directives.
 * Priority:
 * 1. If @expect-body-contains is present and body doesn't contain text -> FAIL
 * 2. If @expected or @expect-status is present and status doesn't match -> FAIL
 * 3. Otherwise -> use default isSuccessful logic
 *
 * @param {object} response - Response object from sendRequest
 * @param {object} test - Test case with possible expectedStatus, expectStatus, expectBodyContains
 * @returns {object} { success: boolean, error: string|null }
 */
function evaluateTestResult(response, test) {
    const bodyText = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);

    // 1. Body assertion has highest priority
    if (test.expectBodyContains) {
        const contains = bodyText != null && bodyText.includes(test.expectBodyContains);
        if (!contains) {
            return {
                success: false,
                error: `Body assertion failed: expected to contain "${test.expectBodyContains}"`
            };
        }
    }

    // 2. Status code assertions
    if (test.expectedStatus !== undefined && test.expectedStatus !== null) {
        if (response.status !== test.expectedStatus) {
            return {
                success: false,
                error: `Unexpected status code: expected ${test.expectedStatus} but got ${response.status}`
            };
        }
        return { success: true, error: null };
    }

    if (test.expectStatus) {
        if (!statusMatches(response.status, test.expectStatus)) {
            return {
                success: false,
                error: `Unexpected status code: expected ${test.expectStatus} but got ${response.status}`
            };
        }
        return { success: true, error: null };
    }

    // 3. Default logic
    const success = isSuccessful(response);
    return {
        success,
        error: success ? null : (response.error || `Request failed with status ${response.status}`)
    };
}

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
        requestBody: null, // Compiled request body for reports (when .http block had a body)
        expectedStatus: test.expectedStatus,
        expectStatus: test.expectStatus,
        expectBodyContains: test.expectBodyContains
    };

    try {
        // JIT COMPILATION: Substitute variables at runtime
        const compiledUrl = substituteVariables(test.request, context);
        const compiledBody = test.body ? substituteVariables(test.body, context) : undefined;

        if (test.body) {
            result.requestBody =
                compiledBody !== undefined && compiledBody !== null ? String(compiledBody) : '';
        }

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

        const evalResult = evaluateTestResult(response, test);
        result.success = evalResult.success;
        result.status = response.status;
        result.statusText = response.statusText;
        result.response = response.data;
        result.error = evalResult.error || response.error;

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
 * Extract test ID from test key (e.g., "### TC-001: description" -> "TC-001")
 * @param {string} testKey - Test case key/title
 * @returns {string|null} Extracted test ID or null if not found
 */
function extractTestId(testKey) {
    // Match patterns like "### TC-001", "### TC-Setup-02", "### TEST123", etc.
    // The pattern looks for ### followed by whitespace, then captures the identifier
    // which consists of letters, numbers, hyphens, and underscores
    const match = testKey.match(/^#+\s*([A-Z]+[A-Z0-9_-]+)/i);
    if (match) {
        return match[1];
    }
    return null;
}

/**
 * Check if a test key matches a filter pattern
 * Supports test ID matching with word boundaries and numeric range matching
 * @param {string} testKey - Test case key/title
 * @param {string} filter - Filter pattern
 * @returns {boolean} True if the test matches the filter
 */
function testMatchesFilter(testKey, filter) {
    const testLower = testKey.toLowerCase();
    const filterLower = filter.toLowerCase();

    // Extract test ID for precise matching (e.g., "TC-Setup-02")
    const testId = extractTestId(testKey);
    if (testId) {
        const testIdLower = testId.toLowerCase();

        // Case 1: Direct exact match - filter is a full test ID like "TC-Setup-02"
        if (testIdLower === filterLower) {
            return true;
        }

        // Case 2: Filter might be just the numeric part like "02"
        // Only match if the test ID ends with the filter (but not as part of another number)
        // This prevents "02" from matching "TC-01-02" or "TC-02-01"
        // Example: "TC-Setup-02" matches filter "02" but "TC-02-01" does not
        const numericMatch = filterLower.match(/^(\d+)$/);
        if (numericMatch && testIdLower.endsWith('-' + filterLower)) {
            return true;
        }

        // Case 3: Filter is a prefix like "TC-Setup"
        // Only match if test ID starts with filter followed by a non-word character
        if (testIdLower.startsWith(filterLower + '-')) {
            return true;
        }
    }

    // Fallback: Try matching with word boundaries on the full test key
    // This handles cases where test ID extraction fails
    const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedFilter}\\b`, 'i');
    if (pattern.test(testLower)) {
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
    if (result.expectedStatus !== undefined && result.expectedStatus !== null) {
        lines.push(`**Expected Status:** ${result.expectedStatus}`);
    } else if (result.expectStatus) {
        lines.push(`**Expected Status:** ${result.expectStatus}`);
    }
    if (result.expectBodyContains) {
        lines.push(`**Expected Body Contains:** "${result.expectBodyContains}"`);
    }
    lines.push(`**Time:** ${result.timestamp}`);
    lines.push('');

    if (result.requestBody != null && String(result.requestBody).trim() !== '') {
        let reqFmt = String(result.requestBody).trim();
        try {
            reqFmt = JSON.stringify(JSON.parse(reqFmt), null, 2);
        } catch {
            // keep raw
        }
        lines.push('**Request body:**');
        lines.push('```json');
        lines.push(reqFmt);
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
