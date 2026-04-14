# Auto-Fix HTTP Test Skill

Automated HTTP test runner with auto-fix and retry loop for Spring Boot applications.

## Overview

This skill automates the process of running HTTP API tests, analyzing failures, and attempting fixes in an iterative loop. It integrates with the **global `run-http-test` CLI command** to execute `.http` test files and provides intelligent failure analysis and automatic Spring Boot application restart.

> **Important**: This skill depends on `run-http-test` as a **global CLI tool** installed on your system. It is NOT a project-local script—ensure it's accessible via your PATH before using this skill.

## Features

- **Automatic Test Execution**: Runs tests using the global `run-http-test` CLI
- **Test Filtering**: Filter tests by title substring using `--filter` parameter
- **Failure Analysis**: Categorizes failures by error type (404, 401, 400, 500, connection refused)
- **Auto-Restart**: Automatically restarts Spring Boot application when needed
- **Interactive Mode**: Prompts user when max retries reached
- **Detailed Logging**: Comprehensive logs and reports in `./output/` directory
- **Spring Boot Integration**: Manages `mvn spring-boot:run` lifecycle

## Installation

```bash
# Clone or copy to your skills directory
cp -r /path/to/auto-fix-http-test ~/.claude/skills/

# Or link to your preferred location
ln -s /Users/ehuhaim/workspace/edu/zero-test/skills/auto-fix-http-test ~/.claude/skills/
```

## Requirements

- **bash**: Shell interpreter
- **jq**: JSON processor for report parsing
- **run-http-test**: **Global CLI command** (installed system-wide, NOT project-specific)
- **lsof**: For port/process checking
- **mvn**: Maven for Spring Boot application management

> **Note**: `run-http-test` is a **global tool** that must be installed on your system and accessible via PATH. It is NOT bundled with this skill or located in the project directory.

## Usage

### Basic Usage

Run all tests in a file:

```bash
./run.sh src/test/http/MdmDeviceCategoryController.http
```

### Filter Tests

Run only tests matching a substring:

```bash
./run.sh src/test/http/MdmDeviceCategoryController.http --filter "TC-001"
./run.sh src/test/http/api-tests.http --filter "login"
```

### Custom Max Retries

Specify maximum fix iterations:

```bash
./run.sh src/test/http/api-tests.http --max-retries 3
```

### Combined Options

```bash
./run.sh src/test/http/api-tests.http --filter "create" --max-retries 10
```

### Help

```bash
./run.sh --help
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `test-file` | Yes | - | Path to `.http` test file |
| `--filter` | No | None | Substring to filter test cases (case-insensitive) |
| `--max-retries` | No | 5 | Maximum fix iterations before prompting |

## Output Files

The skill creates output files in the same directory as the test file:

```
src/test/http/
├── output/
│   ├── <test-name>.md              # Test report from run-http-test
│   ├── auto-fix-<test-name>.log    # Skill execution log
│   ├── auto-fix-report-<test-name>.md  # Fix attempt summary
│   └── spring-boot.log             # Spring Boot application log
```

## Failure Categories

The skill categorizes failures into:

1. **Connection Refused**: App not running or wrong port
2. **Not Found (404)**: Missing endpoints
3. **Auth Errors (401/403)**: Authentication/authorization issues
4. **Bad Request (400)**: Validation errors, malformed requests
5. **Server Errors (500+)**: Application exceptions

## How It Works

1. **Initial Setup**: Validates inputs and locates project root
2. **App Check**: Ensures Spring Boot app is running on port 8080
3. **Test Execution**: Runs tests via `run-http-test` CLI
4. **Report Analysis**: Parses generated Markdown report
5. **Failure Check**: Exits if all tests pass
6. **Fix Analysis**: Categorizes and logs failures
7. **App Restart**: Restarts app if connection errors detected
8. **Retry**: Repeats from step 3
9. **User Prompt**: Asks user what to do when max retries reached

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed |
| 1 | Tests failed after max retries |
| 2 | Invalid arguments or configuration error |

## Project Structure

```
auto-fix-http-test/
├── skill.json          # Skill metadata
├── run.sh              # Main entry point
├── lib/
│   ├── app-manager.sh  # Spring Boot lifecycle management
│   ├── test-runner.sh  # Test execution wrapper
│   ├── report-parser.sh # Report analysis
│   └── fix-engine.sh   # Fix analysis engine
└── README.md           # This file
```

## Integration with Claude Code

This skill can be invoked via:

```
/auto-fix-http-test src/test/http/api-tests.http
```

Or using trigger phrases:
- "auto fix http test"
- "fix and retry tests"
- "run tests until pass"

## Troubleshooting

### Incompatible class format / `._*.class` on U disk (exFAT)

macOS may create AppleDouble files like `._Foo.class` on external volumes. Spring 6 treats them as classes and can fail with **Incompatible class format**. This skill starts the app with `-Dspring.classformat.ignore=true` (see `lib/app-manager.sh`, overridable via `SPRING_BOOT_JVM_ARGS`). Projects may also set the same flag in `spring-boot-maven-plugin` `jvmArguments` or `.mvn/jvm.config` for other Maven/IDE flows.

### Application Won't Start

Check the Spring Boot log:
```bash
cat src/test/http/output/spring-boot.log
```

### Port Already in Use

Find and kill the process:
```bash
lsof -ti:8080 | xargs kill -9
```

### Test Report Not Generated

**Verify `run-http-test` is installed:**

The `run-http-test` command must be a **global CLI tool** available in your system PATH:

```bash
# Check if the command is found
which run-http-test

# Check if it's executable
run-http-test --help
```

If not found, install the `run-http-test` global CLI tool first. This is **NOT** a project-local script or skill—it must be installed system-wide.

**Common locations:**
- User skills: `~/.claude/skills/run-http-test/`
- System commands: `/usr/local/bin/run-http-test`
- Or via npm: `npm install -g http-test-runner`

### jq Not Found

Install jq:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

## Examples

### Example 1: Run Device Category Tests

```bash
./run.sh src/test/http/MdmDeviceCategoryController.http
```

Output:
```
════════════════════════════════════════════════════════════════
  AUTO-FIX HTTP TEST LOOP
════════════════════════════════════════════════════════════════

Test File: /project/src/test/http/MdmDeviceCategoryController.http
Project: /project
Filter: None (all tests)
Max Retries: 5

────────────────────────────────────────────────────────────────
  Iteration 1 / 5
────────────────────────────────────────────────────────────────
[2024-01-01 10:00:00] Running HTTP tests...
...
```

### Example 2: Filter Specific Tests

```bash
./run.sh src/test/http/MdmDeviceCategoryController.http --filter "TC-001"
```

Runs only tests with "TC-001" in the title.

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please submit issues and pull requests.

## Authors

MDM AdCloud Team
