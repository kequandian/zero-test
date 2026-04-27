#!/usr/bin/env node
/**
 * run-http-test - Global CLI for running .http test files
 *
 * This CLI executes the zero-test-skill test runner from any location.
 *
 * Usage:
 *   run-http-test <test-file> [output-dir] [report-name] [--filter <substring>]
 *
 * Arguments:
 *   test-file    Path to .http test file (required)
 *   output-dir   Output directory for reports (optional)
 *   report-name  Name of the report file (optional)
 *
 * Options:
 *   --filter     Run only tests whose title contains the specified substring
 *                Supports: --filter VALUE or --filter=VALUE
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

// Get the run-http-test skill directory relative to this CLI
const runHttpTestSkillDir = path.resolve(__dirname, '../skills/run-http-test');
const testRunnerPath = path.join(runHttpTestSkillDir, 'test-runner-simple.js');

// Get command line arguments
const args = process.argv.slice(2);

// Convert relative paths to absolute paths (relative to user's current directory)
// This is needed because we set cwd to zeroTestSkillDir below
function resolvePath(arg) {
    if (!arg || arg.startsWith('--') || arg.startsWith('-')) {
        return arg; // Don't resolve options/flags
    }
    // Resolve relative to current working directory, not the script directory
    const resolved = path.resolve(process.cwd(), arg);
    return resolved;
}

// Resolve only the test-file path (first positional argument)
// Keep output-dir and report-name as-is (will be resolved by test-runner-simple.js)
// Keep options like --filter unchanged
const resolvedArgs = [];
let positionalCount = 0;
let skipNext = false;
for (let i = 0; i < args.length; i++) {
    if (skipNext) {
        resolvedArgs.push(args[i]);
        skipNext = false;
        continue;
    }
    // Handle --filter=value format (equals sign)
    if (args[i].startsWith('--filter=')) {
        resolvedArgs.push(args[i]);
        continue;
    }
    // Handle --filter value or -f value format (space-separated)
    if (args[i] === '--filter' || args[i] === '-f') {
        resolvedArgs.push(args[i]);
        skipNext = true;
        continue;
    }
    // Skip other flags/options (don't count as positional, don't resolve paths)
    if (args[i].startsWith('-')) {
        resolvedArgs.push(args[i]);
        continue;
    }
    // Only resolve the first positional argument (test-file)
    // Keep output-dir and report-name as relative paths
    if (positionalCount === 0) {
        resolvedArgs.push(resolvePath(args[i]));
    } else {
        resolvedArgs.push(args[i]);
    }
    positionalCount++;
}

// Show help if no arguments or --help flag
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('run-http-test - HTTP Test Runner');
    console.log('');
    console.log('Usage:');
    console.log('  run-http-test <test-file> [output-dir] [report-name]');
    console.log('  run-http-test <test-file> [output-dir] [report-name] --filter <substring>');
    console.log('');
    console.log('Arguments:');
    console.log('  test-file    Path to .http test file (required)');
    console.log('  output-dir   Output directory for reports (optional, default: ./output/)');
    console.log('  report-name  Name of the report file (optional, default: test filename)');
    console.log('');
    console.log('Options:');
    console.log('  -h, --help       Show this help message');
    console.log('  -v, --version    Show version number');
    console.log('  --filter <text>  Run only tests whose title contains the specified text');
    console.log('                   The report will only include filtered test results');
    console.log('                   Supports: --filter VALUE or --filter=VALUE');
    console.log('');
    console.log('Examples:');
    console.log('  run-http-test tests/api-test.http');
    console.log('  run-http-test tests/api-test.http custom-output');
    console.log('  run-http-test tests/api-test.http custom-output my-report');
    console.log('  run-http-test tests/api-test.http --filter "Create User"');
    console.log('  run-http-test tests/api-test.http --filter=TC-001');
    console.log('  run-http-test tests/api-test.http --filter TC-001:TC-010');
    console.log('  run-http-test tests/api-test.http custom-output my-report --filter TC-001');
    process.exit(0);
}

// Show version if --version flag
if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('./package.json');
    console.log(`run-http-test v${pkg.version}`);
    process.exit(0);
}

// Spawn the test runner process
const child = spawn('node', [testRunnerPath, ...resolvedArgs], {
    stdio: 'inherit',
    cwd: runHttpTestSkillDir
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
