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
 * True when @expect-status allows a client error (e.g. 400) so we may send
 * placeholder 0 for missing ids (e.g. optional DELETE after empty page query).
 * @param {string|undefined} expectStatus
 * @returns {boolean}
 */
function expectStatusAllowsPlaceholderFallback(expectStatus) {
    if (!expectStatus || typeof expectStatus !== 'string') return false;
    return (
        statusMatches(400, expectStatus) ||
        statusMatches(404, expectStatus) ||
        statusMatches(422, expectStatus) ||
        statusMatches(409, expectStatus)
    );
}

/**
 * Replace {{var}} with 0 for each name in varNames (regex-safe var names).
 * @param {string} template
 * @param {string[]} varNames
 * @returns {string}
 */
function replaceUnresolvedPlaceholdersWithZero(template, varNames) {
    if (!template) return template;
    let s = template;
    for (const v of varNames) {
        const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'g'), '0');
    }
    return s;
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
 * and bracket indices: data.records[0].id
 */
function getValueByPath(obj, path) {
    if (!path) return undefined;

    const normalized = String(path).replace(/\[(\d+)\]/g, '.$1');
    const keys = normalized.split('.').filter(Boolean);
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        const k = /^\d+$/.test(key) ? parseInt(key, 10) : key;
        current = current[k];
    }

    return current;
}

/**
 * Resolve extract path against both ApiResult-shaped and raw-DTO HTTP bodies.
 * - If `# @extract data.tracks.0.id` but the server returns an unwrapped DTO (`tracks` at root), try `tracks.0.id`.
 * - If `# @extract tracks.0.id` but the body is `{ code, data: { tracks: [...] } }`, try `data.tracks.0.id`.
 *
 * @param {object} obj - Parsed JSON response body
 * @param {string} path - Path from # @extract
 * @returns {unknown}
 */
function getValueByPathWithEnvelopeFallback(obj, path) {
    if (!path || obj === null || obj === undefined) return undefined;

    const p = String(path).trim();
    let v = getValueByPath(obj, p);
    if (v !== undefined) return v;

    // Strip leading "data." when payload is raw (no envelope)
    if (p.startsWith('data.')) {
        v = getValueByPath(obj, p.slice(5));
        if (v !== undefined) return v;
    }

    // Prepend "data." when payload is ApiResult / { code, data }
    if (!p.startsWith('data.')) {
        v = getValueByPath(obj, `data.${p}`);
        if (v !== undefined) return v;
    }

    return undefined;
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
 * Repeat substitution so @ vars that expand to {{extractedId}} resolve after # @extract runs.
 * @param {string} template
 * @param {object} context
 * @param {number} [maxPass]
 * @returns {string}
 */
function substituteVariablesDeep(template, context, maxPass = 8) {
    if (!template) return template;
    let s = template;
    for (let p = 0; p < maxPass; p++) {
        const next = substituteVariables(s, context);
        if (next === s) break;
        s = next;
    }
    return s;
}

const UNRESOLVED_TEMPLATE_RE = /\{\{([^}]+)\}\}/g;

/**
 * File-level `@id = 0` (or `dynamic`) is a placeholder until `# @extract` runs.
 * When expanding --filter dependencies, these must NOT block pulling the producer test.
 * @param {string} _varName
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlaceholderInitialValue(_varName, value) {
    if (value === undefined || value === null) return true;
    if (value === 0) return true;
    const s = String(value).trim();
    if (s === '' || s === '0') return true;
    const sl = s.toLowerCase();
    if (sl === 'dynamic' || sl === 'placeholder') return true;
    return false;
}

/**
 * @param {string|null|undefined} s
 * @returns {string[]}
 */
function listUnresolvedTemplateVars(s) {
    if (!s) return [];
    const out = [];
    let m;
    UNRESOLVED_TEMPLATE_RE.lastIndex = 0;
    while ((m = UNRESOLVED_TEMPLATE_RE.exec(s)) !== null) {
        out.push(m[1].trim());
    }
    return out;
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
        // JIT COMPILATION: Substitute variables at runtime (multi-pass for nested @ → {{extract}})
        let compiledUrl = substituteVariablesDeep(test.request, context);
        let compiledBody = test.body ? substituteVariablesDeep(test.body, context) : undefined;

        if (test.body) {
            result.requestBody =
                compiledBody !== undefined && compiledBody !== null ? String(compiledBody) : '';
        }

        let missingUrl = listUnresolvedTemplateVars(compiledUrl);
        let missingBody = listUnresolvedTemplateVars(
            compiledBody !== undefined && compiledBody !== null ? String(compiledBody) : ''
        );
        let uniq = [...new Set([...missingUrl, ...missingBody])];

        // No row from prior GET → # @extract skipped → {{id}} missing. If @expect-status allows
        // 400/404, send DELETE .../0 so the API returns a client error instead of failing here.
        if (
            uniq.length > 0 &&
            expectStatusAllowsPlaceholderFallback(test.expectStatus)
        ) {
            compiledUrl = replaceUnresolvedPlaceholdersWithZero(compiledUrl, uniq);
            if (compiledBody !== undefined && compiledBody !== null) {
                compiledBody = replaceUnresolvedPlaceholdersWithZero(String(compiledBody), uniq);
            }
            if (test.body) {
                result.requestBody =
                    compiledBody !== undefined && compiledBody !== null ? String(compiledBody) : '';
            }
            result.placeholderFallbackUsed = true;
            missingUrl = listUnresolvedTemplateVars(compiledUrl);
            missingBody = listUnresolvedTemplateVars(
                compiledBody !== undefined && compiledBody !== null ? String(compiledBody) : ''
            );
            uniq = [...new Set([...missingUrl, ...missingBody])];
        }

        if (missingUrl.length > 0 || missingBody.length > 0) {
            const u = uniq;
            result.success = false;
            result.status = 0;
            result.statusText = 'Unresolved template variables';
            result.error = `Unresolved {{variables}} in request: ${u.join(', ')}. Check earlier tests / # @extract and file-level @ vars (e.g. TC-001 must succeed; TC-000-pre* cleanup may be required).`;
            return result;
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
                const value = getValueByPathWithEnvelopeFallback(
                    response.data,
                    extractor.path
                );
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

        // Case 4: Filter is a numeric test id like "TC-001" / "TC-033" — require exact id only.
        // Prevents substring fallback from matching "TC-001" inside "TC-0010".
        if (/^[a-z]+-\d+$/i.test(filterLower)) {
            return testIdLower === filterLower;
        }
    }

    // Fallback: Try matching with word boundaries on the full test key
    // This handles cases where test ID extraction fails
    const escapedFilter = filterLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|\\s)${escapedFilter}(?:$|\\s)`, 'i');
    if (pattern.test(testLower)) {
        return true;
    }

    // Extra fallback: substring match (handles filters with trailing non-word chars like Chinese punctuation)
    if (testLower.includes(filterLower)) {
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

const PLACEHOLDER_VAR_RE = /\{\{([^}]+)\}\}/g;

/**
 * @param {string|null|undefined} s
 * @returns {string[]}
 */
function extractPlaceholderVarNames(s) {
    if (!s) return [];
    const out = [];
    let m;
    PLACEHOLDER_VAR_RE.lastIndex = 0;
    while ((m = PLACEHOLDER_VAR_RE.exec(s)) !== null) {
        out.push(m[1].trim());
    }
    return out;
}

/**
 * @param {object} test
 * @returns {Set<string>}
 */
function collectVarsReferencedByTest(test) {
    const refs = new Set();
    for (const v of extractPlaceholderVarNames(test.request)) {
        refs.add(v);
    }
    for (const v of extractPlaceholderVarNames(test.body)) {
        refs.add(v);
    }
    if (test.tokenVar) {
        refs.add(String(test.tokenVar).trim());
    }
    return refs;
}

/**
 * Follow file-level `@` definitions: e.g. `@path = {{host}}{{base}}/x/{{id}}` or `@url = {{ownershipId1}}`
 * so that `id` / `ownershipId1` are included when resolving TC dependencies.
 *
 * @param {object} initialVars
 * @param {Iterable<string>|Set<string>} seeds - names from URL/body/token (may be @ aliases)
 * @returns {Set<string>}
 */
function expandRefsThroughInitialValues(initialVars, seeds) {
    const keys = new Set(Object.keys(initialVars || {}));
    const out = new Set(seeds);
    let changed = true;
    while (changed) {
        changed = false;
        for (const name of [...out]) {
            if (!keys.has(name)) continue;
            const val = initialVars[name];
            if (val === undefined || val === null) continue;
            for (const inner of extractPlaceholderVarNames(String(val))) {
                if (!out.has(inner)) {
                    out.add(inner);
                    changed = true;
                }
            }
        }
    }
    return out;
}

/**
 * @param {object} test
 * @returns {boolean}
 */
function isRunnableTest(test) {
    return test && (test.status === 'closed' || test.status === 'titled_closed');
}

/**
 * Map each test key -> Set of variable names produced by # @extract on that test.
 * @param {object} tests
 * @param {string[]} testOrder
 * @returns {Record<string, Set<string>>}
 */
function buildVarProducersByTest(tests, testOrder) {
    /** @type {Record<string, Set<string>>} */
    const map = {};
    for (const key of testOrder) {
        const t = tests[key];
        if (!isRunnableTest(t) || !t.extractors || t.extractors.length === 0) {
            continue;
        }
        if (!map[key]) map[key] = new Set();
        for (const ex of t.extractors) {
            if (ex.targetVar) {
                map[key].add(ex.targetVar);
            }
        }
    }
    return map;
}

/**
 * Find the nearest previous test (in file order) that extracts `varName`.
 * @param {string[]} testOrder
 * @param {Record<string, Set<string>>} producersByTest
 * @param {number} consumerIndex
 * @param {string} varName
 * @returns {string|null}
 */
function findProducerTestForVar(testOrder, producersByTest, consumerIndex, varName) {
    for (let i = consumerIndex - 1; i >= 0; i--) {
        const key = testOrder[i];
        const set = producersByTest[key];
        if (set && set.has(varName)) {
            return key;
        }
    }
    return null;
}

/**
 * When --filter is used, also include prior tests that define {{variables}} referenced
 * by the selected cases (via file-level @ aliases into # @extract outputs, or direct
 * {{refs}} in URL/body/token).
 *
 * @param {object} tests - Parsed test cases
 * @param {object} initialVars - @ variables from the top of the .http file
 * @param {string} filter - Raw filter string (comma / range, same as parseFilters)
 * @param {{ warnMissing?: boolean }} [opts]
 * @returns {string[]} Test keys to run, in original file order
 */
function expandFilterWithDependencies(tests, initialVars, filter, opts = {}) {
    const { warnMissing = true } = opts;
    const testOrder = Object.keys(tests).filter(k => k !== 'current');
    const initialVarSet = new Set(Object.keys(initialVars || {}));
    const filters = parseFilters(filter);
    const directMatch = new Set(
        testOrder.filter(k => filters.some(f => testMatchesFilter(k, f)))
    );

    const producersByTest = buildVarProducersByTest(tests, testOrder);

    const required = new Set(directMatch);
    const queue = [...directMatch];
    const warned = new Set();

    while (queue.length > 0) {
        const key = queue.shift();
        const consumerIndex = testOrder.indexOf(key);
        if (consumerIndex < 0) continue;

        const t = tests[key];
        if (!isRunnableTest(t)) continue;

        const expandedRefs = expandRefsThroughInitialValues(
            initialVars,
            collectVarsReferencedByTest(t)
        );

        for (const v of expandedRefs) {
            // Name is declared with @ at top of file — satisfied only if not a placeholder (e.g. @playlistId1 = 0)
            if (initialVarSet.has(v) && !isPlaceholderInitialValue(v, initialVars[v])) {
                continue;
            }

            const producer = findProducerTestForVar(testOrder, producersByTest, consumerIndex, v);
            if (producer) {
                if (!required.has(producer)) {
                    required.add(producer);
                    queue.push(producer);
                }
            } else if (warnMissing) {
                const sig = `${key}::${v}`;
                if (!warned.has(sig)) {
                    warned.add(sig);
                    console.warn(
                        `[run-http-test] Test "${key.replace(/\s+/g, ' ').trim()}" needs {{${v}}} (including via @ alias) but no earlier runnable test defines it via # @extract.`
                    );
                }
            }
        }
    }

    // If TC-001 (main create for this file) is in the run set, also run TC-000-pre* cleanup
    // tests that appear before it — otherwise duplicate code/subDir can make TC-001 fail and
    // # @extract ownershipId1 never runs.
    const idxTC001 = testOrder.findIndex(k => extractTestId(k) === 'TC-001');
    if (idxTC001 >= 0) {
        const runsTC001 = [...required].some(k => extractTestId(k) === 'TC-001');
        if (runsTC001) {
            for (let i = 0; i < idxTC001; i++) {
                const k = testOrder[i];
                const tid = extractTestId(k);
                if (
                    tid &&
                    /^TC-000-pre/i.test(tid) &&
                    isRunnableTest(tests[k])
                ) {
                    required.add(k);
                }
            }
        }
    }

    return testOrder.filter(k => required.has(k));
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

    // Apply filter if provided: run matching tests plus any prior tests needed for {{vars}}
    if (filter) {
        testKeys = expandFilterWithDependencies(tests, initialVars, filter);
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
    formatSummary,
    parseFilters,
    testMatchesFilter,
    expandFilterWithDependencies,
    expandRefsThroughInitialValues,
    collectVarsReferencedByTest,
    isRunnableTest,
    extractTestId,
    substituteVariablesDeep,
    isPlaceholderInitialValue,
    getValueByPath,
    getValueByPathWithEnvelopeFallback
};
