#!/usr/bin/env node
/**
 * run-http-test - Global CLI for running .http test files
 *
 * This CLI executes the zero-test-skill test runner from any location.
 *
 * Usage:
 *   run-http-test <test-file> [output-dir] [report-name]
 *
 * Arguments:
 *   test-file    Path to .http test file (required)
 *   output-dir   Output directory for reports (optional)
 *   report-name  Name of the report file (optional)
 *
 * Installation:
 *   cd /path/to/zero-test/cli
 *   npm install
 *   npm link
 *
 * Uninstallation:
 *   npm unlink -g run-http-test
 */

const path = require('path');
const { spawn } = require('child_process');

// Get the zero-test-skill directory relative to this CLI
const zeroTestSkillDir = path.resolve(__dirname, '../skills/zero-test-skill');
const testRunnerPath = path.join(zeroTestSkillDir, 'test-runner-simple.js');

// Get command line arguments
const args = process.argv.slice(2);

// Show help if no arguments or --help flag
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('run-http-test - HTTP Test Runner');
    console.log('');
    console.log('Usage:');
    console.log('  run-http-test <test-file> [output-dir] [report-name]');
    console.log('');
    console.log('Arguments:');
    console.log('  test-file    Path to .http test file (required)');
    console.log('  output-dir   Output directory for reports (optional, default: ./output/)');
    console.log('  report-name  Name of the report file (optional, default: test filename)');
    console.log('');
    console.log('Options:');
    console.log('  -h, --help    Show this help message');
    console.log('  -v, --version Show version number');
    console.log('');
    console.log('Examples:');
    console.log('  run-http-test tests/api-test.http');
    console.log('  run-http-test tests/api-test.http custom-output');
    console.log('  run-http-test tests/api-test.http custom-output my-report');
    process.exit(0);
}

// Show version if --version flag
if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(`run-http-test v${pkg.version}`);
    process.exit(0);
}

// Spawn the test runner process
const child = spawn('node', [testRunnerPath, ...args], {
    stdio: 'inherit',
    cwd: zeroTestSkillDir
});

// Handle child process exit
child.on('exit', (code) => {
    process.exit(code || 0);
});

child.on('error', (err) => {
    console.error(`Error: Failed to start test runner: ${err.message}`);
    console.error(`Test runner path: ${testRunnerPath}`);
    process.exit(1);
});
