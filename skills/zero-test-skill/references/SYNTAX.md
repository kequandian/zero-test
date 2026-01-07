# .http File Syntax Reference

Complete reference for the .http test file format used by Zero-Test skill.

## Table of Contents

1. [Variables](#variables)
2. [Test Structure](#test-structure)
3. [HTTP Methods](#http-methods)
4. [Headers](#headers)
5. [Request Body](#request-body)
6. [Comments and Titles](#comments-and-titles)
7. [Complete Example](#complete-example)

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

- Body must start with `{` on a new line after headers
- Body ends with `}` followed by a blank line
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

## Best Practices

1. **Organize tests logically** - Group related tests together
2. **Use descriptive titles** - Make test cases self-documenting
3. **Define variables at the top** - Keep configuration in one place
4. **Add comments** - Explain what each test verifies
5. **Follow the blank line rule** - Separate test cases with blank lines
6. **Use force mode for suites** - Run entire test suite even if some tests fail
