#!/bin/bash
# Test runner wrapper for global run-http-test CLI
# Part of the auto-fix-http-test skill

# Run HTTP tests using the global run-http-test CLI
run_http_test() {
    local test_file="$1"
    local filter="$2"
    local output_dir="$3"
    local report_name="$4"

    if [ -z "$test_file" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Test file not provided" >&2
        return 1
    fi

    if [ ! -f "$test_file" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Test file does not exist: $test_file" >&2
        return 1
    fi

    # Get test file directory and name
    local test_dir
    local test_basename
    test_dir=$(dirname "$test_file")
    test_basename=$(basename "$test_file" .http)

    # Default output directory is next to the test file
    if [ -z "$output_dir" ]; then
        output_dir="$test_dir/output"
    fi

    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"

    # Default report name is same as test file
    if [ -z "$report_name" ]; then
        report_name="$test_basename"
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running HTTP tests..."
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Test file: $test_file"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Output dir: $output_dir"

    # Build command
    local cmd="run-http-test \"$test_file\" \"$output_dir\" \"$report_name\""

    # Add filter if provided
    if [ -n "$filter" ]; then
        cmd="$cmd --filter \"$filter\""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Filter: $filter"
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Executing: $cmd"

    # Execute the command
    eval $cmd
    local exit_code=$?

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Test execution completed with exit code: $exit_code"

    return $exit_code
}

# Get the path to the test report
get_report_path() {
    local test_file="$1"
    local output_dir="$2"
    local report_name="$3"

    local test_dir
    local test_basename

    test_dir=$(dirname "$test_file")
    test_basename=$(basename "$test_file" .http)

    if [ -z "$output_dir" ]; then
        output_dir="$test_dir/output"
    fi

    if [ -z "$report_name" ]; then
        report_name="$test_basename"
    fi

    echo "$output_dir/$report_name.md"
}

# Check if report exists
report_exists() {
    local report_path="$1"
    [ -f "$report_path" ]
}

# Export functions
export -f run_http_test
export -f get_report_path
export -f report_exists
