#!/usr/bin/env node
/**
 * run-http-test - Global CLI for Zero-Test HTTP Testing Framework
 *
 * Usage:
 *   run-http-test <test-file> <output-dir> <report-name>
 *
 * Example:
 *   run-http-test tests/api.http output test-report
 */

const path = require('path');
const { main } = require('../skills/zero-test-skill/test-runner-simple');

// Execute the test runner
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
