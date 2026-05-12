/**
 * .http File Parser
 * Parses .http test files and extracts test cases with variables, methods, URLs, and bodies.
 *
 * Enhanced with dynamic variable extraction support:
 * - Lazy variable binding: Variables are NOT substituted at parse time
 * - Extractor syntax: # @extract <JSONPath> -> <VarName>
 * - Runtime context: Variables are resolved during test execution
 */

class HttpParser {
    constructor() {
        this.TESTS = {};
        this.tVARS = {};
        this.extractors = []; // Global extractors (if needed)
    }

    /**
     * Parse each line of the .http file
     */
    readEachLine(line) {
        if (this.isTestTerminated()) {
            return this.currentTestStatus();
        }
        if (this.currentTestStatus() === 'terminated_closed') {
            this.currentTest()['status'] = 'terminated';
        }

        if (line.startsWith("@")) {
            this.parseVariable(line);
        } else if (line.startsWith("#") || line.startsWith("//")) {
            this.parseCommentLine(line);
        } else if (line.startsWith("GET ") || line.startsWith("get ") ||
                   line.startsWith("POST ") || line.startsWith("post ") ||
                   line.startsWith("PUT ") || line.startsWith("put ") ||
                   line.startsWith("PATCH ") || line.startsWith("patch ") ||
                   line.startsWith("DELETE ") || line.startsWith("delete ")) {
            this.parseHttpRequest(line);
            this.expectHeader();
        } else if (line.startsWith("login ")) {
            this.parseLoginRequest(line);
            this.expectHeader();
        } else if (line.startsWith("{") || line.startsWith("[") || this.isMultipartBoundary(line) || line.startsWith("--")) {
            this.parseBodyBegin(line);
        } else if (line === '') {
            this.parseEmptyLine(line);
        } else if (line === '---') {
            this.parseTerminateLine(line);
        } else {
            this.parseAnyLine(line);
        }

        return this.currentTestStatus();
    }

    /**
     * Parse HTTP file content and return test cases
     */
    parseHttpContent(fileContent) {
        this.TESTS = {};
        this.tVARS = {};

        if (fileContent) {
            const lines = fileContent.split("\n");
            for (let i in lines) {
                let line = lines[i] ? lines[i].trim() : '';
                this.readEachLine(line);
            }
        }

        // Handle last test case
        if (this.currentTestStatus() === 'closed' ||
            this.currentTestStatus() === 'titled' ||
            this.currentTestStatus() === 'titled_closed') {
            // Skip
        } else {
            this.closeCurrentTest();
        }

        // Remove current test reference
        if (this.TESTS['current']) {
            delete this.TESTS['current'];
        }

        return this.TESTS;
    }

    /**
     * Get initial variables defined at the top of the file
     * These will be used as the starting context for test execution
     */
    getInitialVars() {
        return { ...this.tVARS };
    }

    // Current test management
    currentTest() {
        return this.TESTS['current'] || {};
    }

    currentTestStatus() {
        return this.TESTS['current'] ? this.TESTS['current']['status'] : undefined;
    }

    closeCurrentTest() {
        if (this.TESTS['current']) {
            this.TESTS['current']['status'] = 'closed';
        }
    }

    expectHeader() {
        if (this.TESTS['current']) {
            this.TESTS['current']['status'] = 'header_expecting';
        }
    }

    isTestTerminated() {
        return this.currentTestStatus() === 'terminated';
    }

    expectBody() {
        if (this.TESTS['current']) {
            this.TESTS['current']['status'] = 'body_expecting';
        }
    }

    requestBody() {
        if (this.TESTS['current']) {
            this.TESTS['current']['status'] = 'body_requesting';
        }
    }

    // Parse variable: @variable=value
    parseVariable(line) {
        const ss = line.split("=");
        const key = ss[0].replace('@', '').trim();
        const value = ss[1] ? ss[1].trim() : '';
        this.tVARS[key] = value;
    }

    // Parse comment/test title
    parseCommentLine(line) {
        this.parseExtractor(line);
        this.parseExpectedStatus(line);
        this.parseExpectStatus(line);
        this.parseExpectBodyContains(line);
        this.parseTestTitle(line);
        this.parseEmptyLine(line);
    }

    /**
     * Parse extractor directive: # @extract <JSONPath> -> <VarName>
     * Example: # @extract data.row_id -> testBuildingId
     */
    parseExtractor(line) {
        const extractMatch = line.match(/^#\s*@extract\s+(.+?)\s*->\s*(\w+)$/);
        if (extractMatch) {
            const jsonPath = extractMatch[1].trim();
            const varName = extractMatch[2].trim();

            if (this.TESTS['current']) {
                if (!this.TESTS['current']['extractors']) {
                    this.TESTS['current']['extractors'] = [];
                }
                this.TESTS['current']['extractors'].push({
                    path: jsonPath,
                    targetVar: varName
                });
            }
        }
    }

    /**
     * Parse expected status directive: # @expected <status>
     * Example: # @expected 400
     */
    parseExpectedStatus(line) {
        const match = line.match(/^#\s*@expected\s+(\d+)$/);
        if (match) {
            const status = parseInt(match[1].trim(), 10);
            if (this.TESTS['current']) {
                this.TESTS['current']['expectedStatus'] = status;
            }
        }
    }

    /**
     * Parse expect-status directive: # @expect-status <values>
     * Supports comma-separated status codes and ranges like 4xx
     * Example: # @expect-status 400,409,422
     */
    parseExpectStatus(line) {
        const match = line.match(/^#\s*@expect-status\s+(.+)$/);
        if (match) {
            const values = match[1].trim();
            if (this.TESTS['current']) {
                this.TESTS['current']['expectStatus'] = values;
            }
        }
    }

    /**
     * Parse expect-body-contains directive: # @expect-body-contains <text>
     * Example: # @expect-body-contains 归属编码已存在
     */
    parseExpectBodyContains(line) {
        const match = line.match(/^#\s*@expect-body-contains\s+(.+)$/);
        if (match) {
            const text = match[1].trim();
            if (this.TESTS['current']) {
                this.TESTS['current']['expectBodyContains'] = text;
            }
        }
    }

    parseTestTitle(line) {
        // Only create tests for lines starting with ###
        if (!line.startsWith('###')) {
            return;
        }

        const key = line;

        // Directive comments (e.g. # @expected 400) should not become test titles.
        // They have already been parsed as metadata by the time we reach here.
        if (/^#\s*@/.test(line)) {
            return;
        }

        // Close last current test
        if (this.TESTS['current']) {
            if (this.currentTestStatus() === 'titled') {
                // Rename the existing test instead of deleting it,
                // so metadata (extractors, expected status, etc.) is preserved.
                const oldKey = this.TESTS['current']['key'];
                delete this.TESTS[oldKey];
                this.TESTS[key] = this.TESTS['current'];
                this.TESTS['current']['key'] = key;
                return;
            } else if (this.currentTestStatus() === 'closed') {
                // Already closed, skip
            } else {
                this.TESTS['current']['status'] = 'titled_closed';
            }
        }

        // Create new test
        this.TESTS[key] = {};
        this.TESTS[key]['status'] = 'titled';

        let titledMethod, titledRequest;
        if (this.currentTestStatus() === 'titled_closed') {
            titledMethod = this.testMethod();
            titledRequest = this.testRequest();
        }

        this.TESTS['current'] = this.TESTS[key];
        this.TESTS['current']['key'] = key;
        this.TESTS['current']['method'] = titledMethod;
        this.TESTS['current']['request'] = titledRequest;
    }

    deleteCurrentTest() {
        if (this.TESTS['current']) {
            const key = this.TESTS['current']['key'];
            if (key) {
                delete this.TESTS[key];
            }
        }
    }

    testMethod() {
        if (this.currentTestStatus() === 'closed' || this.currentTestStatus() === 'titled_closed') {
            return this.currentTest()['method'];
        }
        return null;
    }

    testRequest() {
        if (this.currentTestStatus() === 'closed' || this.currentTestStatus() === 'titled_closed') {
            return this.currentTest()['request'];
        }
        return null;
    }

    // Parse HTTP request line
    parseHttpRequest(line) {
        let request = line;

        // Remove HTTP/1.1 suffix
        request = request.lastIndexOf(" HTTP") > 0
            ? request.substring(0, request.lastIndexOf(" HTTP"))
            : request;

        const CURRENT_TEST = this.TESTS['current'] || {};
        if (request.startsWith("GET ") || request.startsWith("get ")) {
            CURRENT_TEST['method'] = 'GET';
        } else if (request.startsWith("POST ") || request.startsWith("post ")) {
            CURRENT_TEST['method'] = 'POST';
        } else if (request.startsWith("PUT ") || request.startsWith("put ")) {
            CURRENT_TEST['method'] = 'PUT';
        } else if (request.startsWith("PATCH ") || request.startsWith("patch ")) {
            CURRENT_TEST['method'] = 'PATCH';
        } else if (request.startsWith("DELETE ") || request.startsWith("delete ")) {
            CURRENT_TEST['method'] = 'DELETE';
        }

        // Remove method
        request = request.substring(CURRENT_TEST['method'].length).trim();

        // LAZY BINDING: Keep {{variable}} syntax for runtime substitution
        // Variables will be replaced during test execution, not at parse time
        // This enables dynamic variable extraction from previous test responses

        CURRENT_TEST['request'] = request;
    }

    parseLoginRequest(line) {
        let request = line;
        const CURRENT_TEST = this.TESTS['current'] || {};
        CURRENT_TEST['method'] = 'login';
        request = request.substring(CURRENT_TEST['method'].length).trim();
        CURRENT_TEST['request'] = request;
    }

    // Parse body begin
    parseBodyBegin(line) {
        this.requestBody();
        this.collectBodyLine(line);
    }

    // Check if line is a multipart boundary
    isMultipartBoundary(line) {
        const CURRENT_TEST = this.TESTS['current'] || {};
        if (CURRENT_TEST['contentType'] && CURRENT_TEST['contentType'].includes('multipart/form-data')) {
            const boundaryMatch = CURRENT_TEST['contentType'].match(/boundary=([^;\s]+)/i);
            if (boundaryMatch) {
                const boundary = boundaryMatch[1].trim();
                // Check for --BoundaryName or --BoundaryName--
                return line === '--' + boundary || line === '--' + boundary + '--';
            }
        }
        // General check: any line starting with -- could be a multipart boundary
        // We'll validate it later in parseMultipartLine
        return line.startsWith('--');
    }

    // Parse HTTP header
    parseHttpHeader(line) {
        const CURRENT_TEST = this.TESTS['current'] || {};
        if (line.startsWith("Authorization")) {
            // LAZY BINDING: Store the variable name for runtime substitution
            const varMatch = line.match(/\{\{([^}]+)\}\}/);
            if (varMatch) {
                const VAR = varMatch[1];
                // Store the raw variable name (not the value)
                this.collectRequestTokenVar(VAR);
            }
        } else if (line.toLowerCase().startsWith("content-type")) {
            // Store content-type header for multipart detection
            this.collectContentType(line);
        }
    }

    collectContentType(line) {
        if (this.TESTS['current']) {
            const parts = line.split(':', 2);
            if (parts.length === 2) {
                this.TESTS['current']['contentType'] = parts[1].trim();
            }
        }
    }

    collectRequestTokenVar(varName) {
        if (this.TESTS['current']) {
            this.TESTS['current']['tokenVar'] = varName;
        }
    }

    collectBodyLine(json_line) {
        if (this.TESTS['current']) {
            const CURRENT_TEST = this.TESTS['current'];

            // Check if this is multipart/form-data
            if (CURRENT_TEST['contentType'] && CURRENT_TEST['contentType'].includes('multipart/form-data')) {
                // Parse multipart body
                this.parseMultipartLine(json_line);
            } else {
                // Original JSON body handling
                if (!CURRENT_TEST['body']) {
                    CURRENT_TEST['body'] = '';
                }
                // LAZY BINDING: Keep {{variable}} syntax for runtime substitution
                CURRENT_TEST['body'] += json_line;
            }
        }
    }

    /**
     * Parse multipart form data lines
     * Supports:
     * - Boundary markers: --BoundaryName
     * - Content-Disposition headers
     * - File inclusion: < /path/to/file
     */
    parseMultipartLine(line) {
        const CURRENT_TEST = this.TESTS['current'];
        if (!CURRENT_TEST) return;

        // Initialize multipart state if not exists
        if (!CURRENT_TEST['multipart']) {
            CURRENT_TEST['multipart'] = {
                boundary: null,
                parts: [],
                currentPart: null,
                inFileContent: false
            };
        }

        const mp = CURRENT_TEST['multipart'];

        // Extract boundary from content-type if not yet extracted
        if (!mp.boundary && CURRENT_TEST['contentType']) {
            const boundaryMatch = CURRENT_TEST['contentType'].match(/boundary=([^;]+)/i);
            if (boundaryMatch) {
                mp.boundary = boundaryMatch[1].trim();
            }
        }

        // Check for boundary start
        if (line.startsWith('--') && mp.boundary) {
            const boundaryLine = '--' + mp.boundary;
            const closingBoundary = boundaryLine + '--';

            // Closing boundary - end of multipart
            if (line === closingBoundary) {
                if (mp.currentPart) {
                    mp.parts.push(mp.currentPart);
                    mp.currentPart = null;
                }
                mp.inFileContent = false;
                return;
            }

            // Start boundary - new part
            if (line === boundaryLine) {
                if (mp.currentPart) {
                    mp.parts.push(mp.currentPart);
                }
                mp.currentPart = {
                    name: null,
                    filename: null,
                    contentType: null,
                    file: null,
                    value: null
                };
                mp.inFileContent = false;
                return;
            }
        }

        // If we're in file content mode and not a boundary line, skip (file will be read at runtime)
        if (mp.inFileContent) {
            return;
        }

        // Parse Content-Disposition header
        if (line.toLowerCase().startsWith('content-disposition:')) {
            const nameMatch = line.match(/name="([^"]+)"/);
            const filenameMatch = line.match(/filename="([^"]+)"/);
            if (nameMatch && mp.currentPart) {
                mp.currentPart.name = nameMatch[1];
            }
            if (filenameMatch && mp.currentPart) {
                mp.currentPart.filename = filenameMatch[1];
            }
            return;
        }

        // Parse Content-Type header for parts
        if (line.toLowerCase().startsWith('content-type:') && mp.currentPart) {
            const parts = line.split(':', 2);
            if (parts.length === 2) {
                mp.currentPart.contentType = parts[1].trim();
            }
            return;
        }

        // Parse file inclusion syntax: < /path/to/file
        if (line.startsWith('<') && mp.currentPart) {
            const filePath = line.substring(1).trim();
            mp.currentPart.file = filePath;
            mp.inFileContent = true;
            return;
        }

        // Regular value line (for non-file fields)
        if (mp.currentPart && line && !line.startsWith('--')) {
            if (mp.currentPart.value === null) {
                mp.currentPart.value = line;
            } else {
                mp.currentPart.value += '\n' + line;
            }
        }
    }

    parseTerminateLine(line) {
        const testStatus = this.currentTestStatus();
        if (testStatus === 'titled' || testStatus === 'closed' ||
            testStatus === 'terminated_closed' || testStatus === 'titled_closed') {
            if (this.TESTS['current']) {
                this.TESTS['current']['status'] = 'terminated';
            }
        } else {
            if (this.TESTS['current']) {
                this.TESTS['current']['status'] = 'terminated_closed';
            }
        }
    }

    // Parse empty line
    parseEmptyLine(line) {
        const status = this.currentTestStatus();

        // Check if we're in multipart mode - empty lines are part of the multipart structure
        const CURRENT_TEST = this.TESTS['current'] || {};
        const isInMultipart = CURRENT_TEST['contentType'] && CURRENT_TEST['contentType'].includes('multipart/form-data');

        if (status === 'closed') {
            if (this.TESTS['current']) {
                this.TESTS['current']['status'] = 'closed_ignore';
            }
        } else if (status === 'closed_ignore') {
            // Do nothing
        } else if (this.isCurrentTestGet() || this.isCurrentTestLogin()) {
            this.closeCurrentTest();
        } else if (this.isCurrentTestPost() || this.isCurrentTestPut()) {
            if (status === 'header_expecting') {
                this.expectBody();
            } else if (status === 'body_expecting') {
                this.requestBody();
            } else if (status === 'body_requesting') {
                // Don't close test if we're in multipart mode - empty lines are part of multipart structure
                if (!isInMultipart) {
                    this.closeCurrentTest();
                }
            }
        } else if (this.isCurrentTestDelete()) {
            this.closeCurrentTest();
        }
    }

    isCurrentTestGet() {
        return this.currentTest()['method'] === 'GET';
    }

    isCurrentTestPost() {
        return this.currentTest()['method'] === 'POST';
    }

    isCurrentTestPut() {
        return this.currentTest()['method'] === 'PUT';
    }

    isCurrentTestDelete() {
        return this.currentTest()['method'] === 'DELETE';
    }

    isCurrentTestLogin() {
        return this.currentTest()['method'] === 'login';
    }

    // Parse any non-empty line
    parseAnyLine(line) {
        const status = this.currentTestStatus();
        if (status === 'header_expecting') {
            this.parseHttpHeader(line);
        } else if (status === 'body_requesting') {
            this.collectBodyLine(line);
        }
    }
}

module.exports = HttpParser;
