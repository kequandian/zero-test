#!/bin/bash
# Fix engine for analyzing test failures and applying fixes
# Parses test reports for specific error causes and iteratively fixes them

# Global fix counter
FIXES_APPLIED=0
APP_NEEDS_RESTART=false

# Analyze failures and apply fixes
analyze_and_fix() {
    local failures_json="$1"
    local project_dir="$2"
    local log_file="$3"

    if [ -z "$failures_json" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] No failures to analyze"
        return 0
    fi

    if [ -z "$project_dir" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Project directory not provided" >&2
        return 1
    fi

    if ! command -v jq >/dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: jq is required but not installed" >&2
        return 1
    fi

    local failed_count
    failed_count=$(echo "$failures_json" | jq -r '.failed')

    if [ "$failed_count" -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] All tests passed, no fixes needed"
        return 0
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔍 Analyzing $failed_count failure(s)..."
    echo "════════════════════════════════════════════════════════════════"

    # Reset counters
    FIXES_APPLIED=0
    APP_NEEDS_RESTART=false

    # Process each failure
    local iteration=0
    while IFS= read -r failure; do
        iteration=$((iteration + 1))
        local title
        local status
        local method
        local url
        local response
        local message

        title=$(echo "$failure" | jq -r '.title // "Unknown"')
        status=$(echo "$failure" | jq -r '.status // 0')
        method=$(echo "$failure" | jq -r '.method // "GET"')
        url=$(echo "$failure" | jq -r '.url // "/"')
        # Extract response message - it's a JSON string that needs decoding
        response=$(echo "$failure" | jq -r '.response // "null"')
        # Decode the JSON string to get the actual message
        if [ "$response" != "null" ]; then
            message=$(echo "$response" | jq -r)
        else
            message=""
        fi

        echo ""
        echo "[$iteration/$failed_count] Processing: **$title**"
        echo "  Status: $status | $method $url"

        # Log the failure
        {
            echo ""
            echo "## Failure: $title"
            echo "- Status: $status"
            echo "- Method: $method"
            echo "- URL: $url"
            echo "- Message: $message"
        } >> "$log_file"

        # Route to appropriate fixer based on error type
        case "$status" in
            0|*-1)
                handle_connection_refused "$title" "$project_dir" "$log_file"
                ;;
            404)
                handle_not_found "$title" "$method" "$url" "$project_dir" "$log_file"
                ;;
            401|403)
                handle_auth_error "$title" "$status" "$message" "$project_dir" "$log_file"
                ;;
            400)
                handle_bad_request "$title" "$message" "$project_dir" "$log_file"
                ;;
            500|501|502|503)
                handle_server_error "$title" "$message" "$response" "$project_dir" "$log_file"
                ;;
            *)
                handle_other_error "$title" "$status" "$message" "$project_dir" "$log_file"
                ;;
        esac
    done < <(echo "$failures_json" | jq -c '.failures[]')

    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📊 Analysis complete"
    echo "  Fixes applied: $FIXES_APPLIED"
    echo "  App restart needed: $APP_NEEDS_RESTART"

    # Export for main script
    export FIXES_APPLIED
    export APP_NEEDS_RESTART

    return 0
}

# Handle connection refused errors
handle_connection_refused() {
    local title="$1"
    local project_dir="$2"
    local log_file="$3"

    echo "  ⚠️  Connection refused - application may not be running"
    echo "  🔧 Action: Mark application for restart"

    APP_NEEDS_RESTART=true

    echo "  Action: Restart application" >> "$log_file"
}

# Handle 404 Not Found errors
handle_not_found() {
    local title="$1"
    local method="$2"
    local url="$3"
    local project_dir="$4"
    local log_file="$5"

    echo "  ❌ Endpoint not found: $method $url"

    # Extract endpoint path
    local endpoint_path
    endpoint_path=$(echo "$url" | sed 's|http://[^/]*||')

    echo "  📋 Endpoint: $endpoint_path"
    echo "  💡 Suggestion: Implement this endpoint in your controller"

    # Try to find matching controller
    local path_parts
    path_parts=$(echo "$endpoint_path" | tr '/' '\n' | grep -v '^$')

    local controller_name
    local first_segment
    first_segment=$(echo "$endpoint_path" | tr '/' '\n' | grep -v '^$' | head -1)

    if [ -n "$first_segment" ]; then
        # Convert to potential controller name
        controller_name=$(echo "$first_segment" | sed 's/\b\(.\)/\u\1/g')
        echo "  🔍 Look for controller: ${controller_name}Controller" >> "$log_file"
    fi

    echo "  Action: Manual implementation required" >> "$log_file"
}

# Handle authentication errors
handle_auth_error() {
    local title="$1"
    local status="$2"
    local message="$3"
    local project_dir="$4"
    local log_file="$5"

    echo "  🔒 Authentication/Authorization error ($status)"

    if echo "$message" | grep -qi "token"; then
        echo "  💡 Issue: Invalid or expired token"
        echo "  🔧 Action: Check @token variable in .http file"
    elif echo "$message" | grep -qi "permission"; then
        echo "  💡 Issue: Insufficient permissions"
        echo "  🔧 Action: Check user roles and permissions"
    fi

    echo "  Action: Check security configuration" >> "$log_file"
}

# Handle 400 Bad Request errors
handle_bad_request() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  ⚠️  Bad Request - validation or parameter error"

    if echo "$message" | grep -qi "Failed to convert"; then
        echo "  💡 Issue: Type conversion error"
        echo "  🔍 Detecting parameter type mismatch..."

        # Extract the problematic field
        local field
        field=$(echo "$message" | sed -n 's/.*Failed to convert.*for input string "\([^"]*\)".*/\1/p' | head -1)

        if [ -z "$field" ]; then
            field=$(echo "$message" | grep -oE 'input string.*' | sed 's/.*input string //' | sed 's/".*//' | head -1)
        fi

        if [ -n "$field" ]; then
            echo "  📋 Problematic field: $field"
            echo "  💡 Suggestion: Check parameter type in @PathVariable or @RequestParam"

            # Try to fix in .http file
            if attempt_fix_parameter_type "$title" "$field" "$project_dir" "$log_file"; then
                FIXES_APPLIED=$((FIXES_APPLIED + 1))
            fi
        fi
    elif echo "$message" | grep -qi "Valid"; then
        echo "  💡 Issue: Validation failed"
        echo "  🔧 Action: Check @Valid annotations and constraints"
    fi

    echo "  Message: $message" >> "$log_file"
}

# Handle 500 Server Error errors
handle_server_error() {
    local title="$1"
    local message="$2"
    local response="$3"
    local project_dir="$4"
    local log_file="$5"

    echo "  💥 Server Error - analyzing root cause..."
    echo "  📋 Error message: $(echo "$message" | head -c 150)..."

    # Log full error for analysis
    echo "  Full error: $message" >> "$log_file"

    # Detect specific error types and route to specialized fixers
    if echo "$message" | grep -qi "NullPointerException"; then
        fix_nullpointer_exception "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "SQL.*Exception\|JdbcSQL.*Exception\|BadSqlGrammar"; then
        fix_sql_exception "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "Table.*not found"; then
        fix_missing_table "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "Column.*not found\|Unknown column"; then
        fix_missing_column "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "ConstraintViolation\|violates"; then
        fix_constraint_violation "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "BindingException\|ParameterBindingException"; then
        fix_binding_exception "$title" "$message" "$project_dir" "$log_file"
    elif echo "$message" | grep -qi "IllegalArgument\|cannot be null"; then
        fix_illegal_argument "$title" "$message" "$project_dir" "$log_file"
    else
        echo "  ⚠️  Unrecognized error pattern"
        echo "  💡 Suggestion: Check application logs for stack trace"

        # Try to extract stack trace info
        local error_location
        error_location=$(echo "$message" | grep -oE '[^[:space:]]+\.java:[0-9]+' | head -1)

        if [ -n "$error_location" ]; then
            echo "  📍 Location: $error_location"
            echo "  Location: $error_location" >> "$log_file"
        fi
    fi
}

# Fix NullPointerException
fix_nullpointer_exception() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 NullPointerException detected"

    # Extract source location from message
    local source_location
    source_location=$(echo "$message" | grep -oE 'at [^(]+\(' | sed 's/at //' | sed 's/($//' | head -1)

    if [ -n "$source_location" ]; then
        echo "  📍 Source: $source_location"

        # Extract file and line
        local java_file
        local line_num
        java_file=$(echo "$source_location" | sed 's/\.[^.]*$//').java
        line_num=$(echo "$source_location" | grep -oE '[0-9]+$')

        echo "  📁 File: $java_file:$line_num"

        if attempt_fix_npe "$java_file" "$line_num" "$project_dir" "$log_file"; then
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
        fi
    else
        echo "  💡 Check for null values before accessing properties/methods"
    fi

    echo "  Action: Add null check or Optional handling" >> "$log_file"
}

# Fix SQL Exception
fix_sql_exception() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 SQL Exception detected"

    if echo "$message" | grep -qi "Unknown data type"; then
        echo "  💡 Issue: H2/MySQL SQL syntax incompatibility"
        echo "  📋 Pattern: $(echo "$message" | sed -n 's/.*Unknown data type: "\([^"]*\)".*/\1/p')"

        if attempt_fix_sql_syntax "$message" "$project_dir" "$log_file"; then
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            APP_NEEDS_RESTART=true
        fi
    elif echo "$message" | grep -qi "syntax.*error"; then
        echo "  💡 Issue: SQL syntax error"
        local sql_statement
        sql_statement=$(echo "$message" | sed -n 's/.*SQL statement: \[\([^]]*\)\].*/\1/p' | head -1)
        echo "  📋 Statement: $(echo "$sql_statement" | head -c 100)"
    fi

    echo "  Action: Fix SQL syntax or check database compatibility" >> "$log_file"
}

# Fix missing table
fix_missing_table() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Missing table detected"

    # Extract table name
    local table_name
    table_name=$(echo "$message" | grep -oiP 'Table "\K[^"]+' | head -1)

    if [ -z "$table_name" ]; then
        table_name=$(echo "$message" | grep -oiP 'table "\K[^"]+' | head -1)
    fi

    if [ -n "$table_name" ]; then
        echo "  📋 Missing table: $table_name"

        if attempt_add_table "$table_name" "$project_dir" "$log_file"; then
            FIXES_APPLIED=$((FIXES_APPLIED + 1))
            APP_NEEDS_RESTART=true
        fi
    fi

    echo "  Action: Add missing table to schema.sql" >> "$log_file"
}

# Fix missing column
fix_missing_column() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Missing column detected"

    local column_name
    column_name=$(echo "$message" | grep -oiP 'column "\K[^"]+' | head -1)

    if [ -n "$column_name" ]; then
        echo "  📋 Missing column: $column_name"
        echo "  💡 Suggestion: Add column to existing table"
    fi

    echo "  Action: Add missing column to table" >> "$log_file"
}

# Fix constraint violation
fix_constraint_violation() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Constraint violation detected"

    if echo "$message" | grep -qi "duplicate.*key\|unique"; then
        echo "  💡 Issue: Duplicate value in unique column"
        echo "  💡 Check test data for duplicates"
    elif echo "$message" | grep -qi "foreign key"; then
        echo "  💡 Issue: Foreign key constraint violation"
        echo "  💡 Check referenced entity exists"
    elif echo "$message" | grep -qi "NOT NULL\|cannot be null"; then
        echo "  💡 Issue: Required field is null"
        echo "  💡 Check request body includes all required fields"
    fi

    echo "  Action: Fix constraint violation" >> "$log_file"
}

# Fix binding exception
fix_binding_exception() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Parameter binding exception"

    local param_name
    param_name=$(echo "$message" | grep -oiP 'parameter "\K[^"]+' | head -1)

    if [ -n "$param_name" ]; then
        echo "  📋 Problematic parameter: $param_name"
        echo "  💡 Check @RequestParam, @PathVariable, or @RequestBody mapping"
    fi

    echo "  Action: Fix parameter binding" >> "$log_file"
}

# Fix illegal argument
fix_illegal_argument() {
    local title="$1"
    local message="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Illegal argument exception"

    echo "  💡 Check method arguments are valid"
    echo "  💡 Common causes: null values, empty strings, invalid format"

    echo "  Action: Validate input arguments" >> "$log_file"
}

# Handle other errors
handle_other_error() {
    local title="$1"
    local status="$2"
    local message="$3"
    local project_dir="$4"
    local log_file="$5"

    echo "  ⚠️  Unexpected status code: $status"
    echo "  📋 Message: $(echo "$message" | head -c 100)"

    echo "  Action: Investigate unexpected error" >> "$log_file"
}

# ===========================================================================
# ATTEMPT FIX FUNCTIONS - Try to automatically fix detected issues
# ===========================================================================

# Attempt to fix parameter type in .http file
attempt_fix_parameter_type() {
    local title="$1"
    local field="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Attempting to fix parameter type issue..."

    # Find the .http file
    local http_files
    http_files=$(find "$project_dir/src/test/http" -name "*.http" 2>/dev/null)

    if [ -z "$http_files" ]; then
        echo "  ⚠️  No .http files found in src/test/http"
        return 1
    fi

    # Look for unexpanded variables
    while IFS= read -r http_file; do
        if grep -q "{{.*}}" "$http_file" 2>/dev/null; then
            echo "  📁 Found .http file: $(basename "$http_file")"
            echo "  ⚠️  Unexpanded variables detected"
            echo "  💡 Check @extract directives and variable dependencies"
            echo "  Issue: Unexpanded variables in $http_file" >> "$log_file"
            return 1
        fi
    done <<< "$http_files"

    return 1
}

# Attempt to fix NPE in Java file
attempt_fix_npe() {
    local java_file="$1"
    local line_num="$2"
    local project_dir="$3"
    local log_file="$4"

    echo "  🔧 Attempting to fix NPE..."

    # Find the Java file
    local file_path
    file_path=$(find "$project_dir/src/main/java" -name "$(basename "$java_file")" 2>/dev/null | head -1)

    if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
        echo "  ⚠️  Could not locate Java file"
        return 1
    fi

    echo "  📁 File: $file_path"

    # Backup
    cp "$file_path" "${file_path}.bak"

    # Add a TODO comment at the problematic line
    awk -v line="$line_num" '
        NR == line {
            print "        // TODO: Fix NPE - add null check"
        }
        { print }
    ' "$file_path" > "${file_path}.tmp" && mv "${file_path}.tmp" "$file_path"

    if [ -f "${file_path}.bak" ]; then
        if ! diff -q "$file_path" "${file_path}.bak" >/dev/null 2>&1; then
            echo "  ✅ Added TODO comment for NPE fix"
            rm -f "${file_path}.bak"
            return 0
        fi
        rm -f "${file_path}.bak"
    fi

    return 1
}

# Attempt to fix SQL syntax
attempt_fix_sql_syntax() {
    local message="$1"
    local project_dir="$2"
    local log_file="$3"

    echo "  🔧 Attempting to fix SQL syntax..."

    # Find mapper XML files
    local mapper_files
    mapper_files=$(find "$project_dir/src/main" -name "*Mapper.xml" 2>/dev/null)

    if [ -z "$mapper_files" ]; then
        echo "  ⚠️  No mapper XML files found"
        return 1
    fi

    while IFS= read -r mapper_file; do
        echo "  📁 Checking: $(basename "$mapper_file")"

        # Look for UNION with parameterized column names
        if grep -qi "UNION.*\? as id" "$mapper_file" 2>/dev/null; then
            echo "  ✅ Found problematic UNION syntax"

            # Backup
            cp "$mapper_file" "${mapper_file}.bak"

            # Fix: Replace parameterized column in UNION
            sed -i.tmp 's/UNION ALL SELECT COUNT(\*) as count, ? as id/UNION ALL SELECT COUNT(*) as count, t1.id as id/g' "$mapper_file" 2>/dev/null
            rm -f "${mapper_file}.tmp"

            if [ -f "${mapper_file}.bak" ]; then
                if ! diff -q "$mapper_file" "${mapper_file}.bak" >/dev/null 2>&1; then
                    echo "  ✅ Modified: $mapper_file"
                    echo "  Modified: $mapper_file" >> "$log_file"
                    rm -f "${mapper_file}.bak"
                    return 0
                fi
                rm -f "${mapper_file}.bak"
            fi
        fi
    done <<< "$mapper_files"

    return 1
}

# Attempt to add missing table
attempt_add_table() {
    local table_name="$1"
    local project_dir="$2"
    local log_file="$3"

    echo "  🔧 Attempting to add missing table..."

    local schema_file="$project_dir/src/main/resources/schema.sql"

    if [ ! -f "$schema_file" ]; then
        echo "  ⚠️  schema.sql not found"
        return 1
    fi

    # Check if table already exists
    if grep -qi "CREATE TABLE.*$table_name" "$schema_file"; then
        echo "  ⚠️  Table already exists in schema.sql"
        return 1
    fi

    # Generate a basic table definition
    echo "  ✅ Adding table definition for: $table_name"

    cat >> "$schema_file" << EOF

-- Auto-generated table for $table_name
CREATE TABLE IF NOT EXISTS $table_name (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_flag SMALLINT DEFAULT 0
);
EOF

    echo "  ✅ Added basic table structure to schema.sql"
    echo "  ⚠️  Note: Add specific columns for your use case"
    echo "  Added table: $table_name" >> "$log_file"

    return 0
}

# Generate a summary report of the fix attempt
generate_fix_summary() {
    local failures_json="$1"
    local iteration="$2"
    local output_file="$3"

    if ! command -v jq >/dev/null 2>&1; then
        return 1
    fi

    {
        echo "## Fix Iteration $iteration"
        echo "**Timestamp:** $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        echo "### Failures Detected"
        echo "- Total: $(echo "$failures_json" | jq -r '.total')"
        echo "- Failed: $(echo "$failures_json" | jq -r '.failed')"
        echo "- Passed: $(echo "$failures_json" | jq -r '.passed')"
        echo "- Fixes Applied: $FIXES_APPLIED"
        echo ""
        echo "### Failure Details"
        echo "$failures_json" | jq -r '.failures[] | "- **\(.title)**: `\(.method) \(.url)` → \(.status)"'
        echo ""
        echo "---"
        echo ""
    } >> "$output_file"
}

# Export functions
export -f analyze_and_fix
export -f handle_connection_refused
export -f handle_not_found
export -f handle_auth_error
export -f handle_bad_request
export -f handle_server_error
export -f handle_other_error
export -f fix_nullpointer_exception
export -f fix_sql_exception
export -f fix_missing_table
export -f fix_missing_column
export -f fix_constraint_violation
export -f fix_binding_exception
export -f fix_illegal_argument
export -f attempt_fix_parameter_type
export -f attempt_fix_npe
export -f attempt_fix_sql_syntax
export -f attempt_add_table
export -f generate_fix_summary
