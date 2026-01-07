---
name: zero-test
description: Execute .http test files and generate test reports with Markdown and PDF output. Use for parsing and executing HTTP requests from .http format files. Supports GET/POST/PUT/DELETE methods with variable substitution. Generates automated test reports with pass/fail statistics. Exports results as both Markdown and PDF documents. Ideal for API testing, contract testing, and generating test execution documentation.
---

# Zero-Test Skill

Execute .http test files and generate professional test reports.

## Quick Start

```bash
# Install dependencies
npm install axios mdpdf

# Run tests
node -e "
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');
const { saveReport } = require('./scripts/reporter');

const fs = require('fs');
const parser = new HttpParser();
const content = fs.readFileSync('test.http', 'utf-8');
const tests = parser.parseHttpContent(content);

runTests(tests, { force: true }).then(summary => {
    const stylesheet = './assets/markdown.css';
    return saveReport(summary, './output', 'report', stylesheet);
}).then(paths => {
    console.log('Report saved:', paths.pdf);
});
"
```

## .http File Syntax

### Variables
```
@baseUrl=http://api.example.com
@token=your-auth-token
```

### Test Structure
```
### Test Case Title
# Description of what this test verifies

GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}

### Create New User
# Tests user creation endpoint

POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}

{
    "name": "John Doe",
    "email": "john@example.com"
}

### Update User
# Tests user update functionality

PUT {{baseUrl}}/api/users/1
Authorization: Bearer {{token}}

{
    "name": "Jane Doe"
}
```

## Script Modules

### scripts/parser.js
Parses .http file format:
- Variable substitution (`@variable=value`, `{{variable}}`)
- HTTP methods (GET, POST, PUT, DELETE)
- JSON body parsing
- Test titles from comments

### scripts/http.js
HTTP client using axios:
- Request execution with timeout
- Authorization headers
- Response validation

### scripts/runner.js
Test execution engine:
- Sequential test execution
- Success/failure tracking
- Force mode (continue on errors)

### scripts/reporter.js
Report generation:
- Markdown test logs
- PDF export via mdpdf
- Test statistics summary

## Usage Examples

### Basic Test Execution
```javascript
const HttpParser = require('./scripts/parser');
const { runTests } = require('./scripts/runner');

const fs = require('fs');
const parser = new HttpParser();
const tests = parser.parseHttpContent(fs.readFileSync('api-tests.http', 'utf-8'));

runTests(tests).then(summary => {
    console.log(\`Passed: \${summary.passed}/\${summary.total}\`);
});
```

### Generate PDF Report
```javascript
const { saveReport } = require('./scripts/reporter');

saveReport(summary, './reports', 'api-test-report', './assets/markdown.css')
    .then(paths => console.log('PDF:', paths.pdf));
```

### Custom Test Callback
```javascript
runTests(tests, {
    force: false,
    onTestComplete: async (result, index) => {
        console.log(\`Test \${index}: \${result.success ? 'PASS' : 'FAIL'}\`);
    }
});
```

## Test Result Format

Each test result includes:
- `title`: Test case name
- `method`: HTTP method
- `url`: Request URL
- `success`: Boolean pass/fail
- `status`: HTTP status code
- `response`: Response body
- `timestamp`: Execution time

## Dependencies

Add to `package.json`:
```json
{
    "dependencies": {
        "axios": "^1.6.0",
        "mdpdf": "^1.2.0"
    }
}
```
