---
name: zero-test
description: Core framework for executing .http test files and generating test reports. Provides parser, HTTP client, test runner, and Markdown reporter modules. Use this skill for understanding internals or programmatic usage. For agent-oriented task guidance, use the focused sub-skills instead.
related_skills:
  - run-http-skill: Execute .http test files (../run-http-skill/SKILL.md)
  - test-report-skill: Understand and customize Markdown reports (../test-report-skill/SKILL.md)
  - render-pdf-mdpdf: Convert Markdown reports to PDF (../render-pdf-mdpdf/SKILL.md)
---

# Zero-Test Skill

A universal HTTP testing framework that executes .http test files and generates professional test reports.

## Quick Start

```bash
# Install dependencies
npm install axios

# (Optional) Install PDF converter
# mdpdf (recommended - full CSS support)
npm install mdpdf

# Run tests with PDF output
cd skills/zero-test-skill
node test-render-pdf-mdpdf.js ../../path/to/test.http ../../output report-name
```

## Features

- **.http File Format**: Use familiar HTTP request format
- **Variable Substitution**: Define variables and reuse across tests
- **Dynamic Variable Extraction**: Capture values from API responses and use in subsequent requests
- **Multiple HTTP Methods**: GET, POST, PUT, PATCH, DELETE, etc.
- **Test Reports**: Generate Markdown and PDF reports
- **Flexible Testing**: Ideal for API testing, contract testing, smoke tests

## .http File Syntax

### Variables
```
@baseUrl=http://api.example.com
@token=your-auth-token
@userId=123
```

### Test Structure
```
### Test Case Title
# Optional description of what this test verifies

GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}

### Create New User
# Tests user creation endpoint

POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com"
}

### Update User
# Tests user update functionality

PUT {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}

{
    "name": "Jane Doe"
}
```

### Dynamic Variable Extraction

Extract values from API responses and use them in subsequent requests:

```
### Create Resource
# Create a new resource and capture its ID

POST {{baseUrl}}/api/resources
Authorization: Bearer {{token}}

{
    "name": "Test Resource",
    "type": "test"
}

# @extract data.id -> resourceId

### Get Created Resource
# Use the extracted ID to fetch the resource

GET {{baseUrl}}/api/resources/{{resourceId}}
Authorization: Bearer {{token}}

### Update Resource
# Update the resource using the captured ID

PUT {{baseUrl}}/api/resources/{{resourceId}}
Authorization: Bearer {{token}}

{
    "name": "Updated Resource"
}

# @extract data.id -> updatedResourceId

### Delete Resource
# Clean up test data

DELETE {{baseUrl}}/api/resources/{{resourceId}}
Authorization: Bearer {{token}}
```

**Extractor Syntax**: `# @extract <JSONPath> -> <VariableName>`

- Uses dot notation for nested values: `data.user.id`, `items.0.name`
- Extracted variables persist across all subsequent tests
- Variables can be used in URLs, headers, and request bodies
- If the path doesn't exist, no variable is created (no error)

## Running Tests

### Basic Usage
```bash
node test-runner-simple.js <test-file> <output-dir> <report-name>
```

### Example
```bash
# From project root
node skills/zero-test-skill/test-runner-simple.js \
    tests/api-tests.http \
    output \
    api-test-report

# From skill directory
cd skills/zero-test-skill
node test-runner-simple.js \
    ../../tests/api-tests.http \
    ../../output \
    api-test-report
```

### Test Output

The test runner generates:
- **Console Output**: Real-time test execution status with ✓ PASS / ✗ FAIL indicators
- **Markdown Report**: Detailed test results in markdown format

Example console output:
```
============================================================
Zero-Test Runner
============================================================
Test File:    tests/api-tests.http
Output Dir:   output
Report Name:  api-test-report
============================================================
Found 10 test cases

Running tests...
------------------------------------------------------------
[1] ✓ PASS - Health Check (200 OK)
[2] ✓ PASS - List Users (200 OK)
[3] ✓ PASS - Create User (201 Created) [Extracted: userId=123]
[4] ✓ PASS - Get User (200 OK) [Extracted: userName=John, email=john@example.com]
[5] ✗ FAIL - Update User (400 Bad Request)
...
------------------------------------------------------------

Test Execution Summary
============================================================
Total Tests:   10
Passed:        8
Failed:        2
Skipped:       0
Duration:      1.23s
Pass Rate:     80.0%
============================================================
```

## Script Modules

### scripts/parser.js
Parses .http file format:
- Variable substitution (`@variable=value`, `{{variable}}`)
- Dynamic extractor syntax (`# @extract <JSONPath> -> <VariableName>`)
- Lazy variable binding (variables resolved at runtime)
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- JSON body parsing
- Test titles from comments
- Request headers parsing

### scripts/http-native.js
Native HTTP client (Node.js built-in):
- Request execution with timeout
- Authorization headers
- Response validation
- Error handling

### scripts/runner.js
Test execution engine:
- Runtime variable context management
- JIT (Just-In-Time) variable compilation
- Response value extraction with JSONPath
- Sequential test execution
- Success/failure tracking
- Force mode (continue on errors)
- Progress reporting with extracted variables

### scripts/reporter.js
Report generation:
- Markdown test logs
- Test statistics summary
- Detailed error reporting

## PDF Output

PDF generation is provided by the **render-pdf-mdpdf** skill.

### Generate PDF Reports

```bash
node test-render-pdf-mdpdf.js <test-file> <md-output-dir> <report-name> [--pdf-output-dir]
```

### Example

```bash
# Generate PDF with default output (~/Downloads)
node test-render-pdf-mdpdf.js ../../tests/api-tests.http output api-report

# Specify custom PDF output directory
node test-render-pdf-mdpdf.js ../../tests/api-tests.http output api-report --pdf-output-dir ./pdf-reports
```

### About render-pdf-mdpdf Skill

The PDF conversion uses the independent **render-pdf-mdpdf** skill, which provides:
- Full HTML/CSS rendering with custom styles
- Excellent Chinese font support (Microsoft YaHei)
- Professional GitHub-style formatting
- Custom CSS configuration

See [../render-pdf-mdpdf/SKILL.md](../render-pdf-mdpdf/SKILL.md) for more details.

### Installation

**mdpdf (Recommended)**

```bash
npm install mdpdf
```

For faster download in China, set mirror:
```bash
set PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots
npm install mdpdf
```

See [PDF-MDPDF-IMPLEMENTATION.md](PDF-MDPDF-IMPLEMENTATION.md) for detailed configuration.

## Usage Examples

### Programmatic Usage
```javascript
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');

const fs = require('fs');
const parser = new HttpParser();
const tests = parser.parseHttpContent(fs.readFileSync('api-tests.http', 'utf-8'));

// Get initial variables defined in the .http file
const initialVars = parser.getInitialVars();

runTests(tests, {
    initialVars: initialVars,
    onTestComplete: async (result, index) => {
        const extractInfo = result.extractedVars && Object.keys(result.extractedVars).length > 0
            ? ` [Extracted: ${Object.entries(result.extractedVars).map(([k, v]) => `${k}=${v}`).join(', ')}]`
            : '';
        console.log(`[${index}] ${result.success ? 'PASS' : 'FAIL'}${extractInfo}`);
    }
}).then(summary => {
    console.log(`Passed: ${summary.passed}/${summary.total}`);
    console.log(`Duration: ${summary.duration}s`);
});
```

### Custom Test Callback
```javascript
runTests(tests, {
    force: false,
    onTestComplete: async (result, index) => {
        console.log(`Test ${index}: ${result.success ? 'PASS' : 'FAIL'}`);
        console.log(`  Status: ${result.status}`);
        console.log(`  URL: ${result.url}`);
    }
});
```

## Test Result Format

Each test result includes:
```javascript
{
    title: "Test Case Title",
    method: "GET",
    url: "http://api.example.com/users",
    success: true,
    status: 200,
    response: "{...}",
    timestamp: "2025-03-21T10:30:00.000Z",
    duration: 123,
    extractedVars: {
        userId: 123,
        userName: "John Doe"
    }
}
```

### Extracted Variables in Reports

The test report includes a dedicated section for extracted variables:

```markdown
### ✓ PASS - Create User

**Method:** POST
**URL:** http://api.example.com/users
**Status:** 201 Created

**Response:**
```json
{
  "id": 123,
  "name": "John Doe"
}
```

**🔧 Extracted Variables:**
- `userId`: `123`
- `userName`: `John Doe`
```

## Advanced Features

### Environment-Specific Variables
```
@baseUrl={{API_BASE_URL}}
@token={{API_TOKEN}}
```

Then run with environment variables:
```bash
API_BASE_URL=http://localhost:3000 \
API_TOKEN=secret123 \
node test-runner-simple.js test.http output report
```

### Request Headers
```
GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}
X-Custom-Header: value
X-Another-Header: {{variable}}
Accept: application/json
```

### JSON Request Body
```
POST {{baseUrl}}/api/users
Content-Type: application/json

{
    "name": "{{userName}}",
    "email": "{{userEmail}}",
    "age": 30,
    "active": true
}
```

### Form Data
```
POST {{baseUrl}}/api/form
Content-Type: application/x-www-form-urlencoded

name=John+Doe&email=john@example.com
```

## Dependencies

Install required packages:
```bash
npm install axios
```

For PDF generation (optional):
```bash
npm install mdpdf
```

## Troubleshooting

### Issue: Module Not Found
**Solution:** Install dependencies
```bash
npm install axios
```

### Issue: Tests Fail to Connect
**Solution:** Check network connectivity and verify the target API is accessible
```bash
curl http://your-api-endpoint/health
```

### Issue: Variable Not Substituted
**Solution:** Ensure variables are defined with `@` prefix before use
```
@apiUrl=http://api.example.com    # Correct
apiUrl=http://api.example.com     # Wrong - missing @
```

## Best Practices

1. **Organize Tests**: Group related tests in separate .http files
2. **Use Descriptive Titles**: Make test titles clear and specific
3. **Add Comments**: Use `#` comments to document test purpose
4. **Handle Variables**: Define common variables at the top of the file
5. **Check Status Codes**: Verify expected HTTP status codes
6. **Clean Up**: Delete test data after tests if needed

## Project Integration

This skill can be used by other projects as a testing framework.

Example wrapper script:
```javascript
const { spawn } = require('child_process');
const path = require('path');

function runTests(testFile, outputDir, reportName) {
    const zeroTestSkill = path.resolve(__dirname, 'path/to/zero-test-skill');
    const testRunner = path.join(zeroTestSkill, 'test-runner-simple.js');

    return spawn('node', [testRunner, testFile, outputDir, reportName], {
        stdio: 'inherit',
        cwd: zeroTestSkill
    });
}

// Use in your project
runTests('tests/my-api.http', 'output', 'my-report');
```

## License

Part of the Zero-Test project.
