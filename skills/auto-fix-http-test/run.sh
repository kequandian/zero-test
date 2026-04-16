#!/bin/bash
# Auto-Fix HTTP Test Loop Skill
# Main entry point for automated HTTP testing with auto-fix and retry
#
# Usage: run.sh <test-file> [--filter <substring>] [--max-retries <n>]
#
# Examples:
#   run.sh src/test/http/api-tests.http
#   run.sh src/test/http/api-tests.http --filter "TC-001"
#   run.sh src/test/http/api-tests.http --filter "login" --max-retries 3

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default configuration (must be set before sourcing libraries)
DEFAULT_MAX_RETRIES=5
ABSOLUTE_MAX_RETRIES=20
DEFAULT_PORT=8080
DEFAULT_HOST="localhost"
HEALTH_CHECK_TIMEOUT=60

# Non-interactive mode (skip user prompts)
AUTO_FIX_MODE="${AUTO_FIX_MODE:-true}"
AUTO_RESTART_APP="${AUTO_RESTART_APP:-true}"

# Source library functions
source "$SCRIPT_DIR/lib/app-manager.sh"
source "$SCRIPT_DIR/lib/test-runner.sh"
source "$SCRIPT_DIR/lib/report-parser.sh"
source "$SCRIPT_DIR/lib/fix-engine.sh"

# Display usage information
usage() {
    cat << EOF
Auto-Fix HTTP Test Loop Skill

USAGE:
    run.sh <test-file> [--filter <substring>] [--max-retries <n>]

ARGUMENTS:
    test-file       Path to the .http test file (required)

OPTIONS:
    --filter        Substring to filter test cases (case-insensitive, optional)
    --max-retries   Maximum number of fix iterations (default: 5)

EXAMPLES:
    # Run all tests
    run.sh src/test/http/api-tests.http

    # Run specific tests matching a filter
    run.sh src/test/http/api-tests.http --filter "TC-001"

    # Run with custom max retries
    run.sh src/test/http/api-tests.http --max-retries 3

EXIT CODES:
    0   All tests passed
    1   Tests failed after max retries
    2   Invalid arguments or configuration error

EOF
}

# Parse command line arguments
parse_args() {
    if [ $# -eq 0 ]; then
        usage
        exit 2
    fi

    TEST_FILE=""
    FILTER=""
    MAX_RETRIES="$DEFAULT_MAX_RETRIES"

    while [ $# -gt 0 ]; do
        case "$1" in
            --help|-h)
                usage
                exit 0
                ;;
            --filter)
                FILTER="$2"
                shift 2
                ;;
            --max-retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            -*)
                echo "ERROR: Unknown option: $1" >&2
                usage
                exit 2
                ;;
            *)
                if [ -z "$TEST_FILE" ]; then
                    TEST_FILE="$1"
                else
                    echo "ERROR: Multiple test files specified" >&2
                    usage
                    exit 2
                fi
                shift
                ;;
        esac
    done

    # Validate test file
    if [ -z "$TEST_FILE" ]; then
        echo "ERROR: Test file not specified" >&2
        usage
        exit 2
    fi

    # Convert to absolute path
    if [[ ! "$TEST_FILE" = /* ]]; then
        TEST_FILE="$(cd "$(dirname "$TEST_FILE")" && pwd)/$(basename "$TEST_FILE")"
    fi

    if [ ! -f "$TEST_FILE" ]; then
        echo "ERROR: Test file does not exist: $TEST_FILE" >&2
        exit 2
    fi

    # Validate max retries
    if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]] || [ "$MAX_RETRIES" -lt 1 ]; then
        echo "ERROR: Invalid max-retries value: $MAX_RETRIES" >&2
        exit 2
    fi

    # Set project directory (parent of test file directory)
    # Navigate up from src/test/http to project root
    PROJECT_DIR="$(cd "$(dirname "$TEST_FILE")" && pwd)"

    # Try to find project root by looking for pom.xml
    while [ "$PROJECT_DIR" != "/" ] && [ ! -f "$PROJECT_DIR/pom.xml" ]; do
        PROJECT_DIR="$(dirname "$PROJECT_DIR")"
    done

    if [ ! -f "$PROJECT_DIR/pom.xml" ]; then
        echo "ERROR: Could not find project root (no pom.xml found)" >&2
        exit 2
    fi

    # Set up output directory
    OUTPUT_DIR="$(dirname "$TEST_FILE")/output"
    mkdir -p "$OUTPUT_DIR"

    # Set up log file
    LOG_FILE="$OUTPUT_DIR/auto-fix-$(basename "$TEST_FILE" .http).log"
    FIX_REPORT="$OUTPUT_DIR/auto-fix-report-$(basename "$TEST_FILE" .http).md"

    # Initialize log
    {
        echo "# Auto-Fix HTTP Test Log"
        echo "**Test File:** $TEST_FILE"
        echo "**Project:** $PROJECT_DIR"
        echo "**Filter:** ${FILTER:-None}"
        echo "**Max Retries:** $MAX_RETRIES"
        echo "**Started:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
    } > "$LOG_FILE"
}

# Ask user whether to continue
ask_continue() {
    local iteration="$1"
    local max_retries="$2"
    local failed_count="$3"

    # Non-interactive mode: always continue if AUTO_FIX_MODE is true
    if [ "$AUTO_FIX_MODE" = "true" ]; then
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "  Auto-fix mode: Continuing iteration $iteration / $max_retries"
        echo "  Remaining failures: $failed_count"
        echo "════════════════════════════════════════════════════════════════"
        return 0  # Always continue in auto-fix mode
    fi

    # Interactive mode
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Maximum retries reached: $iteration / $max_retries"
    echo "  Remaining failures: $failed_count"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Choose an action:"
    echo "  1) Continue fixing (run another iteration)"
    echo "  2) Stop and show summary"
    echo "  3) Stop and open shell for manual debugging"
    echo ""
    read -p "Your choice [1-3]: " choice

    case "$choice" in
        1)
            return 0  # Continue
            ;;
        2)
            return 1  # Stop
            ;;
        3)
            echo "Opening shell in project directory: $PROJECT_DIR"
            echo "Type 'exit' to return to the script"
            (cd "$PROJECT_DIR" && bash --norc)
            return 1  # Stop after shell
            ;;
        *)
            echo "Invalid choice, stopping..."
            return 1
            ;;
    esac
}

# Show final summary
show_summary() {
    local final_result="$1"
    local total_iterations="$2"

    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  AUTO-FIX HTTP TEST - FINAL SUMMARY"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Test File: $TEST_FILE"
    echo "Filter: ${FILTER:-None}"
    echo "Total Iterations: $total_iterations"
    echo "Max Retries: $MAX_RETRIES"
    echo "Absolute Max Retries: $ABSOLUTE_MAX_RETRIES"
    echo ""

    if [ "$final_result" -eq 0 ]; then
        echo "✅ Result: ALL TESTS PASSED"
    else
        echo "❌ Result: TESTS FAILED"
        if [ $total_iterations -ge $ABSOLUTE_MAX_RETRIES ]; then
            echo "⚠️  Stopped at absolute maximum retry limit ($ABSOLUTE_MAX_RETRIES) to avoid infinite loop."
        fi
        echo ""
        echo "View detailed report: $FIX_REPORT"
        echo "View log: $LOG_FILE"
    fi

    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# Main execution flow
main() {
    parse_args "$@"

    echo "════════════════════════════════════════════════════════════════"
    echo "  AUTO-FIX HTTP TEST LOOP"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Test File: $TEST_FILE"
    echo "Project: $PROJECT_DIR"
    echo "Filter: ${FILTER:-None (all tests)}"
    echo "Max Retries: $MAX_RETRIES"
    echo "Output: $OUTPUT_DIR"
    echo "════════════════════════════════════════════════════════════════"
    echo ""

    # Check if app is running before starting
    if ! is_app_running "$DEFAULT_PORT"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application not running on port $DEFAULT_PORT"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting application..."
        if ! start_app "$PROJECT_DIR" "$DEFAULT_PORT" "$OUTPUT_DIR/spring-boot.log"; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to start application" >&2
            exit 2
        fi
    fi

    local iteration=0
    local full_fail_filtered_pass_count=0

    while [ $iteration -lt $MAX_RETRIES ] && [ $iteration -lt $ABSOLUTE_MAX_RETRIES ]; do
        iteration=$((iteration + 1))
        echo ""
        echo "────────────────────────────────────────────────────────────────"
        echo "  Iteration $iteration / $MAX_RETRIES"
        echo "────────────────────────────────────────────────────────────────"

        # Step 1: Run full test suite
        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running FULL test suite..."
        set +e
        run_http_test "$TEST_FILE" "${FILTER:-}" "$OUTPUT_DIR"
        local test_exit_code=$?
        set -e

        echo "[DEBUG] Full suite exit code: $test_exit_code" >&2

        # Get report path
        local report_path
        report_path=$(get_report_path "$TEST_FILE" "$OUTPUT_DIR")

        # Check if report exists
        if ! report_exists "$report_path"; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Test report not generated at $report_path" >&2
            exit 2
        fi

        # Parse report
        set +e
        local result_json
        result_json=$(parse_report "$report_path" 2>&1)
        local parse_result=$?
        set -e

        # Check if JSON parsing succeeded
        if ! echo "$result_json" | jq '.' >/dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to parse test report" >&2
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Result was: $result_json" >&2
            exit 2
        fi

        # Check if all tests passed
        local all_passed
        all_passed=$(echo "$result_json" | jq -r '.all_passed')

        if [ "$all_passed" = "true" ]; then
            echo ""
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ All tests passed!"
            show_summary 0 $iteration
            exit 0
        fi

        # Get failure details
        local failed_count
        failed_count=$(echo "$result_json" | jq -r '.failed')

        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $failed_count test(s) failed in full suite"

        # Step 2: Identify first failed test
        local first_failed_title
        first_failed_title=$(echo "$result_json" | jq -r '.failures[0].title // empty')

        if [ -z "$first_failed_title" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Could not extract failed test title from report" >&2
            exit 2
        fi

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🎯 Targeting failed test: $first_failed_title"

        # Step 3: Analyze dependencies for the failed test
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔍 Analyzing dependencies..."
        local dep_json
        dep_json=$(node "$SCRIPT_DIR/lib/dependency-analyzer.js" "$TEST_FILE" "$first_failed_title" 2>&1)

        if ! echo "$dep_json" | jq '.' >/dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Dependency analyzer failed" >&2
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Output: $dep_json" >&2
            exit 2
        fi

        local dep_filter
        dep_filter=$(echo "$dep_json" | jq -r '.filterString // empty')
        local dep_titles
        dep_titles=$(echo "$dep_json" | jq -r '.testTitles | join(", ") // empty')

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Minimal execution set: $dep_titles"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔖 Filter: $dep_filter"

        # Step 4: Run filtered tests (failed TC + dependencies)
        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running FILTERED test set..."
        set +e
        run_http_test "$TEST_FILE" "$dep_filter" "$OUTPUT_DIR"
        local filtered_exit_code=$?
        set -e

        echo "[DEBUG] Filtered set exit code: $filtered_exit_code" >&2

        local filtered_report
        filtered_report=$(get_report_path "$TEST_FILE" "$OUTPUT_DIR")

        if ! report_exists "$filtered_report"; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Filtered test report not generated" >&2
            exit 2
        fi

        set +e
        local filtered_json
        filtered_json=$(parse_report "$filtered_report" 2>&1)
        set -e

        if ! echo "$filtered_json" | jq '.' >/dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to parse filtered test report" >&2
            exit 2
        fi

        local filtered_failed
        filtered_failed=$(echo "$filtered_json" | jq -r '.failed // 0')

        if [ "$filtered_failed" -eq 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Filtered set passed! Re-running full suite in next iteration to verify..."
            full_fail_filtered_pass_count=$((full_fail_filtered_pass_count + 1))
            if [ $full_fail_filtered_pass_count -ge 2 ]; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Filtered tests keep passing but full suite still fails. Test isolation issue detected. Stopping to avoid infinite loop."
                show_summary 1 $iteration
                exit 1
            fi
            continue
        fi

        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $filtered_failed test(s) still failing in filtered set"

        # Check if we've reached max retries
        if [ $iteration -ge $MAX_RETRIES ]; then
            if ! ask_continue "$iteration" "$MAX_RETRIES" "$filtered_failed"; then
                show_summary 1 $iteration
                exit 1
            fi
            # User chose to continue, increment max retries effectively
            MAX_RETRIES=$((MAX_RETRIES + 1))
        fi

        # Step 5: Generate fix summary and attempt fixes
        generate_fix_summary "$filtered_json" "$iteration" "$FIX_REPORT"

        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔧 Analyzing $filtered_failed failure(s)..."
        analyze_and_fix "$filtered_json" "$PROJECT_DIR" "$LOG_FILE" "$TEST_FILE"

        # Get flags from analyze_and_fix
        local fixes_applied=${FIXES_APPLIED:-0}
        local app_needs_restart=${APP_NEEDS_RESTART:-false}

        # Check if connection refused indicates app needs restart
        local has_conn_error
        has_conn_error=$(echo "$filtered_json" | jq -r '.failures[] | select(.status == 0 or .status == -1) | .title' | wc -l | tr -d ' ')

        if [ "$has_conn_error" -gt 0 ]; then
            app_needs_restart=true
        fi

        # Restart app if fixes were applied or connection errors detected
        if [ "$app_needs_restart" = true ]; then
            if [ "$AUTO_RESTART_APP" = "true" ]; then
                echo ""
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting application..."
                stop_app "$DEFAULT_PORT"
                sleep 3
                start_app "$PROJECT_DIR" "$DEFAULT_PORT" "$OUTPUT_DIR/spring-boot.log"
                app_needs_restart=false

                # Wait for app to be ready
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for application to be ready..."
                local health_wait=0
                while [ $health_wait -lt 30 ]; do
                    if curl -s "http://$DEFAULT_HOST:$DEFAULT_PORT/actuator/health" >/dev/null 2>&1; then
                        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application is ready!"
                        break
                    fi
                    sleep 2
                    health_wait=$((health_wait + 2))
                done
            fi
        fi

        # If no fixes applied and no restart needed, we are stuck in an infinite loop
        if [ "$fixes_applied" -eq 0 ] && [ "$app_needs_restart" != "true" ]; then
            echo ""
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ No fixes could be applied for: $first_failed_title"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping to avoid infinite loop."
            show_summary 1 $iteration
            exit 1
        fi

        # Wait before next iteration
        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting 3 seconds before next iteration..."
        sleep 3
    done

    # Should not reach here, but just in case
    show_summary 1 $iteration
    exit 1
}

# Run main function
main "$@"
