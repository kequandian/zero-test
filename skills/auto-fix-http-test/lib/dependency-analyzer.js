#!/usr/bin/env node
/**
 * Dependency Analyzer for .http test files
 *
 * Parses .http files and builds a dependency graph between test cases
 * based on variable extraction (@extract) and usage ({{varName}}).
 */

const fs = require('fs');

/**
 * Parse a .http file and build test case metadata
 */
function parseHttpFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const testCases = [];
    let currentTest = null;
    let inBody = false;
    let bodyBraceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        // Variable definitions at top level (not inside a test)
        if (line.startsWith('@') && !currentTest) {
            continue;
        }

        // New test case title
        if (line.startsWith('###')) {
            if (currentTest) {
                testCases.push(currentTest);
            }
            currentTest = {
                title: line,
                displayTitle: line.replace(/^#+\s*/, '').trim(),
                extracts: [],      // variables this test defines
                uses: new Set(),   // variables this test uses
                lines: []
            };
            inBody = false;
            bodyBraceCount = 0;
            continue;
        }

        if (!currentTest) {
            continue;
        }

        currentTest.lines.push(rawLine);

        // Extractor: # @extract data.id -> ownershipId1
        const extractMatch = line.match(/^#\s*@extract\s+.+?\s*->\s*(\w+)$/);
        if (extractMatch) {
            currentTest.extracts.push(extractMatch[1]);
            continue;
        }

        // Track body state for JSON bodies
        if (line.includes('{')) {
            inBody = true;
            bodyBraceCount += (line.match(/\{/g) || []).length;
            bodyBraceCount -= (line.match(/\}/g) || []).length;
            if (bodyBraceCount <= 0) {
                inBody = false;
                bodyBraceCount = 0;
            }
        } else if (inBody && line.includes('}')) {
            bodyBraceCount -= (line.match(/\}/g) || []).length;
            bodyBraceCount += (line.match(/\{/g) || []).length;
            if (bodyBraceCount <= 0) {
                inBody = false;
                bodyBraceCount = 0;
            }
        }

        // Find variable usages in the line
        const varMatches = rawLine.match(/\{\{(\w+)\}\}/g);
        if (varMatches) {
            for (const match of varMatches) {
                const varName = match.replace(/\{\{|\}\}/g, '');
                // Skip special JetBrains variables
                if (!varName.startsWith('$')) {
                    currentTest.uses.add(varName);
                }
            }
        }
    }

    if (currentTest) {
        testCases.push(currentTest);
    }

    return testCases;
}

/**
 * Build a mapping of variable -> test case index (last definition wins)
 */
function buildVarDefinitions(testCases) {
    const varToTestIndex = new Map();
    for (let i = 0; i < testCases.length; i++) {
        for (const varName of testCases[i].extracts) {
            varToTestIndex.set(varName, i);
        }
    }
    return varToTestIndex;
}

/**
 * Get all dependencies for a given test case index
 * Returns a Set of test case indices that must be executed before/during the target test
 */
function getDependencies(testCases, varToTestIndex, targetIndex, visited = new Set()) {
    if (visited.has(targetIndex)) {
        return visited;
    }
    visited.add(targetIndex);

    const testCase = testCases[targetIndex];
    for (const varName of testCase.uses) {
        const depIndex = varToTestIndex.get(varName);
        if (depIndex !== undefined && depIndex < targetIndex) {
            // This variable is defined by an earlier test
            getDependencies(testCases, varToTestIndex, depIndex, visited);
        }
    }

    return visited;
}

/**
 * Compute minimal execution set for a list of failed test titles
 * Returns an object with:
 *   - testIndices: sorted array of test indices to execute
 *   - testTitles: array of test titles
 *   - filterString: comma-separated test IDs for --filter
 */
function computeExecutionSet(testCases, failedTitles) {
    const varToTestIndex = buildVarDefinitions(testCases);

    const allIndices = new Set();
    for (const failedTitle of failedTitles) {
        const targetIndex = testCases.findIndex(tc =>
            tc.title === failedTitle || tc.displayTitle === failedTitle
        );
        if (targetIndex === -1) {
            console.error(`Test case not found: ${failedTitle}`);
            continue;
        }
        const deps = getDependencies(testCases, varToTestIndex, targetIndex);
        for (const idx of deps) {
            allIndices.add(idx);
        }
    }

    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b);
    const testTitles = sortedIndices.map(i => testCases[i].displayTitle);

    // Build filter string from test case titles
    // We use the full title for filtering since the runner supports substring matching
    const filterString = testTitles.join(',');

    return {
        testIndices: sortedIndices,
        testTitles: testTitles,
        filterString: filterString
    };
}

/**
 * Main CLI entrypoint
 * Usage: node dependency-analyzer.js <http-file> <failed-title-1> [failed-title-2] ...
 */
function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node dependency-analyzer.js <http-file> <failed-title-1> [failed-title-2] ...');
        process.exit(1);
    }

    const filePath = args[0];
    const failedTitles = args.slice(1);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const testCases = parseHttpFile(filePath);
    const result = computeExecutionSet(testCases, failedTitles);

    // Output as JSON for bash consumption
    console.log(JSON.stringify(result));
}

module.exports = {
    parseHttpFile,
    buildVarDefinitions,
    getDependencies,
    computeExecutionSet
};

if (require.main === module) {
    main();
}
