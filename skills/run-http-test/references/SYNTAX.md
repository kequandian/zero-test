# .http File Syntax Reference

Complete reference for the .http test file format used by Zero-Test skill.

## Table of Contents

1. [Variables](#variables)
2. [Test Structure](#test-structure)
3. [HTTP Methods](#http-methods)
4. [Headers](#headers)
5. [Request Body](#request-body)
6. [Comments and Titles](#comments-and-titles)
7. [Variable Extraction](#variable-extraction)
8. [Complete Example](#complete-example)

## Variables

Define variables at the top of your .http file using `@` prefix:

```
@baseUrl=http://localhost:8080
@authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
@userId=12345
```

### Variable Rules

- Variables are defined as `@name=value`
- Variable names are case-sensitive
- Values can be URLs, tokens, or any text
- Use variables in requests with `{{variableName}}` syntax

### Variable Substitution

Variables can be substituted in:
- URLs: `GET {{baseUrl}}/api/users`
- Headers: `Authorization: Bearer {{authToken}}`

## Test Structure

Each test case starts with a title using `###` or `#`:

```
### Get User Profile
# This test retrieves the user profile information

GET {{baseUrl}}/api/users/{{userId}}
```

### Test Titles

- `### Test Name` - Creates a titled test case
- `# Description` - Adds description/narrative to the test
- The combination creates organized, documented test cases

## HTTP Methods

Supported HTTP methods:

### GET
```
### List All Users
GET {{baseUrl}}/api/users
Authorization: Bearer {{token}}
```

### POST
```
### Create New User
POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}

{
    "name": "John Doe",
    "email": "john@example.com"
}
```

### PUT
```
### Update User
PUT {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}

{
    "name": "Jane Doe",
    "email": "jane@example.com"
}
```

### DELETE
```
### Delete User
DELETE {{baseUrl}}/api/users/{{userId}}
Authorization: Bearer {{token}}
```

### Custom Login
```
### Admin Login
login {{baseUrl}}/api/oauth/login

{
    "account": "admin",
    "password": "secret123"
}
```

## Headers

Add headers after the HTTP method line:

```
### POST with Custom Headers
POST {{baseUrl}}/api/data
Authorization: Bearer {{token}}
Content-Type: application/json
X-Custom-Header: custom-value

{
    "key": "value"
}
```

### Common Headers

- `Authorization: Bearer {{token}}` - Authentication token
- `Content-Type: application/json` - JSON content type (default)

## Request Body

For POST and PUT requests, add JSON body:

```
### Create Resource
POST {{baseUrl}}/api/resources
Authorization: Bearer {{token}}

{
    "stringField": "value",
    "numberField": 123,
    "booleanField": true,
    "objectField": {
        "nested": "data"
    },
    "arrayField": [1, 2, 3]
}
```

### Body Rules

- Body must start with `{` or `[` (JSON object or array) on a new line after headers
- Body ends when a blank line closes the request block (after the closing `}` or `]`)
- JSON syntax must be valid

## Comments and Titles

### Single Line Comments
```
# This is a comment explaining the test
```

### Test Titles
```
### User Authentication Test
# Verifies login endpoint with valid credentials
```

### Block Comments
```
# Test suite for user management
# Author: QA Team
# Date: 2024-01-15
```

## Variable Extraction

Dynamic variable extraction allows you to capture values from API responses and use them in subsequent requests. This enables end-to-end testing workflows where one test's output becomes another test's input.

### Extract Syntax

Use the `# @extract` directive to capture values from responses:

```
# @extract <JSONPath> -> <VariableName>
```

### Examples

#### Extract ID from Response
```
### Create Building
# Create a new building and capture its ID

POST {{baseUrl}}/api/buildings
Authorization: Bearer {{token}}

{
    "name": "A栋",
    "code": "BUILDING-A"
}

# @extract data.row_id -> testBuildingId
```

#### Extract Multiple Values
```
### Create User
# Create user and extract both ID and email

POST {{baseUrl}}/api/users
Authorization: Bearer {{token}}

{
    "name": "John Doe",
    "email": "john@example.com"
}

# @extract data.user_id -> newUserId
# @extract data.email -> newUserEmail
```

#### Use Extracted Variable
```
### Get Building by ID
# Use the extracted building ID from previous test

GET {{baseUrl}}/api/buildings/{{testBuildingId}}
Authorization: Bearer {{token}}
```

#### Extract Nested Values
```
### Get User Profile
# Extract nested profile information

GET {{baseUrl}}/api/users/me
Authorization: Bearer {{token}}

# @extract data.profile.settings.theme -> userTheme
# @extract data.profile.company.name -> companyName
```

### JSONPath Support

The extractor uses dot notation for JSONPath:

| Response | Path | Extracted Value |
|----------|------|-----------------|
| `{"data": {"id": 123}}` | `data.id` | `123` |
| `{"user": {"profile": {"name": "John"}}}` | `user.profile.name` | `"John"` |
| `{"items": [{"id": 1}]}` | `items.0.id` | `1` |

**ApiResult vs raw body:** many endpoints return `{ "code", "data": { ... } }`, while others return the DTO at the top level. If the path does not match, the runner automatically tries the alternate shape: paths starting with `data.` are also resolved without that prefix, and paths without `data.` are tried with a `data.` prefix. So `data.tracks.0.id` still works when the JSON is `{"tracks":[...]}` without a `data` wrapper.

### Complete Workflow Example

```
@baseUrl=http://localhost:8080
@adminToken=your-admin-token-here

### Create Building
# Step 1: Create a building and capture its ID

POST {{baseUrl}}/api/buildings
Authorization: Bearer {{adminToken}}

{
    "name": "Test Building",
    "code": "TEST-001"
}

# @extract data.row_id -> buildingId

### Get Building
# Step 2: Use the extracted ID to fetch the building

GET {{baseUrl}}/api/buildings/{{buildingId}}
Authorization: Bearer {{adminToken}}

### Update Building
# Step 3: Update the building using the captured ID

PUT {{baseUrl}}/api/buildings/{{buildingId}}
Authorization: Bearer {{adminToken}}

{
    "name": "Updated Building Name"
}

# @extract data.row_id -> updatedBuildingId

### Delete Building
# Step 4: Clean up by deleting the test data

DELETE {{baseUrl}}/api/buildings/{{buildingId}}
Authorization: Bearer {{adminToken}}
```

### Extractor Behavior

- Extractors run **after** the request completes
- If the path doesn't exist, no variable is created (no error)
- Extracted variables are available to **all subsequent tests**
- Variables persist until the test run completes
- Later extractions with the same variable name **overwrite** earlier values

## Termination

Use `---` to stop parsing tests after that point:

```
### First Test
GET {{baseUrl}}/api/test1

---

### Second Test
GET {{baseUrl}}/api/test2
```

In this example, only the first test will execute. The second is terminated.

## Complete Example

```
@endpoint=http://localhost:8080
@testToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Test Suite
# Tests CRUD operations for user management

### Login as Admin
# Authentication test with admin credentials

POST {{endpoint}}/api/oauth/login

{
    "account": "admin",
    "password": "admin123"
}

### Get User List
# Retrieve all users after authentication

GET {{endpoint}}/api/users
Authorization: Bearer {{testToken}}

### Create New User
# Test user creation with valid data

POST {{endpoint}}/api/users
Authorization: Bearer {{testToken}}

{
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
}

### Get Created User
# Verify the user was created successfully

GET {{endpoint}}/api/users?username=testuser
Authorization: Bearer {{testToken}}

### Update User
# Modify user email address

PUT {{endpoint}}/api/users/1
Authorization: Bearer {{testToken}}

{
    "email": "updated@example.com"
}

### Delete User
# Clean up test data

DELETE {{endpoint}}/api/users/1
Authorization: Bearer {{testToken}}
```

## Multi-entity dependencies and foreign keys

When several entities share a parent key (e.g. `batch_id`, `notice_id`, `questionnaire_id`):

1. **Do not delete the parent** until every child that still references `{{parentId}}` in the JSON body has finished its **POST → GET → list → PUT → DELETE** cycle.
2. Placing **`DELETE` on the parent early** (e.g. deleting the batch in section 1 before section 2) typically causes child **POST** to fail with **5xx** and **no `@extract`**, so IDs stay as the literal placeholder **`dynamic`** in URLs → **404 / 4xx** on follow-up requests.
3. **Preferred patterns**:
   - Move **parent `DELETE` to the end** of the file (teardown section), or
   - **Create a fresh parent** at the start of each major block and `@extract` a new id for that block only.

## Best Practices

1. **Organize tests logically** - Group related tests together
2. **Use descriptive titles** - Make test cases self-documenting
3. **Define variables at the top** - Keep configuration in one place
4. **Add comments** - Explain what each test verifies
5. **Follow the blank line rule** - Separate test cases with blank lines
6. **Use force mode for suites** - Run entire test suite even if some tests fail
7. **Respect parent/child order** - See [Multi-entity dependencies and foreign keys](#multi-entity-dependencies-and-foreign-keys) above
