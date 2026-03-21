# Claude Code Instructions - Zero-Test Project

## Project Overview

Zero-Test is a universal HTTP testing framework that executes .http test files and generates professional test reports (Markdown format).

This project provides the **zero-test-skill** which can be used by any project for HTTP testing.

## Quick Start

```bash
# Install dependencies
npm install axios mdpdf

# Run tests
node skills/zero-test-skill/test-runner-simple.js \
    path/to/test.http \
    output \
    report-name
```

## Project Structure

```
zero-test/
├── skills/zero-test-skill/         # Universal HTTP testing framework
│   ├── SKILL.md                    # Skill documentation
│   ├── test-runner-simple.js       # Test runner (Markdown only)
│   ├── test-runner.js              # Test runner (with PDF support)
│   ├── scripts/
│   │   ├── parser.js               # .http file parser
│   │   ├── http-native.js          # Native HTTP client
│   │   ├── runner.js               # Test execution engine
│   │   └── reporter.js             # Report generator
│   ├── assets/
│   │   └── markdown.css            # Report styling
│   └── references/
│       └── SYNTAX.md               # .http file syntax reference
├── public/testcase/                # Example test files
│   ├── demo-zero-test.http         # Demo test suite (JSONPlaceholder)
│   ├── demo.http
│   └── org.test.http
└── CLAUDE.md                        # This file
```

## Using Zero-Test in Your Project

### As a Dependency

Other projects can use zero-test-skill as a testing framework:

```bash
# From your project directory
node ../zero-test/skills/zero-test-skill/test-runner-simple.js \
    tests/your-api.http \
    output \
    your-report
```

### Create a Wrapper Script

Create `skills/run-http-test/run-test.js` in your project:

```javascript
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const [testFile, outputDir, reportName] = process.argv.slice(2);
const zeroTestSkill = path.resolve(__dirname, '../../zero-test/skills/zero-test-skill');
const testRunner = path.join(zeroTestSkill, 'test-runner-simple.js');

spawn('node', [testRunner, testFile, outputDir, reportName], {
    stdio: 'inherit',
    cwd: zeroTestSkill
});
```

## Test File Format

### Variables
```
@baseUrl=http://api.example.com
@token=your-auth-token
```

### Test Cases
```
### Test Case Title
# Description of what this test verifies

GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}

### Create Resource
# Create a new resource with POST

POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com"
}
```

## Running Tests

### From Zero-Test Project
```bash
# Run demo tests
node skills/zero-test-skill/test-runner-simple.js \
    public/testcase/demo-zero-test.http \
    output \
    demo-report
```

### From Another Project (EAV-Rust Example)
```bash
cd ../eav/eav-rust

# Using the wrapper
node skills/run-http-test-skill/run-test.js \
    tests/eav-api-test.http \
    output \
    eav-report

# Or directly
node ../zero-test/skills/zero-test-skill/test-runner-simple.js \
    tests/eav-api-test.http \
    output \
    eav-report
```

## Test Output

The test runner generates:
- **Console Output**: Real-time test execution status with ✓ PASS / ✗ FAIL indicators
- **Markdown Report**: Detailed test results in markdown format

## Troubleshooting

### Issue: Module Not Found
**Solution:** Install dependencies
```bash
npm install axios mdpdf
```

### Issue: Tests Fail to Connect
**Solution:** Check your network connection and verify the target API is accessible.

## Documentation

- [Zero-Test Skill Documentation](skills/zero-test-skill/SKILL.md) - Complete framework documentation
- [.http File Syntax Reference](skills/zero-test-skill/references/SYNTAX.md) - Syntax guide

## Projects Using Zero-Test

- **EAV-Rust**: Uses zero-test-skill for EAV API testing
  - Wrapper: `../eav/eav-rust/skills/run-http-test-skill/`
