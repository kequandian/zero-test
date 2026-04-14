#!/bin/bash
# Spring Boot application lifecycle management
# Part of the auto-fix-http-test skill

# Default configuration (values can be overridden by main script)
DEFAULT_PORT="${DEFAULT_PORT:-8080}"
DEFAULT_HOST="${DEFAULT_HOST:-localhost}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-60}"

# Spring 6 on exFAT/U-disk: macOS AppleDouble ._*.class → Incompatible class format unless ignored
SPRING_BOOT_JVM_ARGS="${SPRING_BOOT_JVM_ARGS:--Dspring.classformat.ignore=true}"

# Check if Spring Boot application is running
is_app_running() {
    local port="${1:-$DEFAULT_PORT}"

    # Check if port is listening
    if lsof -i ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Running
    fi

    # Alternative: check for Java process with Spring Boot
    if pgrep -f "spring-boot:run" >/dev/null 2>&1; then
        return 0  # Running
    fi

    return 1  # Not running
}

# Stop the Spring Boot application
stop_app() {
    local port="${1:-$DEFAULT_PORT}"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping Spring Boot application on port $port..."

    # Find and kill process listening on the port
    local pid
    pid=$(lsof -ti ":$port" 2>/dev/null)

    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null
        sleep 2

        # Force kill if still running
        if lsof -ti ":$port" >/dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Force killing process $pid..."
            kill -9 "$pid" 2>/dev/null
        fi

        # Wait for port to be free
        local count=0
        while lsof -ti ":$port" >/dev/null 2>&1 && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done

        if lsof -ti ":$port" >/dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to stop application" >&2
            return 1
        fi

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application stopped"
        return 0
    fi

    # Try killing by process name
    pkill -f "spring-boot:run" 2>/dev/null
    sleep 2

    if is_app_running "$port"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Failed to stop application" >&2
        return 1
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application stopped (was not running or killed)"
    return 0
}

# Start the Spring Boot application
start_app() {
    local project_dir="$1"
    local port="${2:-$DEFAULT_PORT}"
    local log_file="$3"

    if [ -z "$project_dir" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Project directory not provided" >&2
        return 1
    fi

    if [ ! -d "$project_dir" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Project directory does not exist: $project_dir" >&2
        return 1
    fi

    # Check if pom.xml exists
    if [ ! -f "$project_dir/pom.xml" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: pom.xml not found in $project_dir" >&2
        return 1
    fi

    # Stop if already running
    if is_app_running "$port"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application already running, stopping first..."
        stop_app "$port" || return 1
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Spring Boot application..."

    # Start application in background
    cd "$project_dir" || return 1

    # Pass JVM args to the forked app VM (works even when project pom omits spring-boot plugin jvmArguments)
    local mvn_run=(mvn spring-boot:run "-Dspring-boot.run.jvmArguments=${SPRING_BOOT_JVM_ARGS}")
    if [ -n "$log_file" ]; then
        nohup "${mvn_run[@]}" > "$log_file" 2>&1 &
    else
        nohup "${mvn_run[@]}" > /dev/null 2>&1 &
    fi

    local mvn_pid=$!
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Maven started with PID: $mvn_pid"

    # Wait for application to be ready
    local count=0
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for application to be ready..."

    while [ $count -lt $HEALTH_CHECK_TIMEOUT ]; do
        if is_app_running "$port"; then
            # Additional check: try to connect to the port
            if (echo >/dev/tcp/"$DEFAULT_HOST"/"$port") 2>/dev/null; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application is ready on port $port"
                return 0
            fi
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done

    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Application failed to start within $HEALTH_CHECK_TIMEOUT seconds" >&2

    # Check Maven process status
    if ps -p "$mvn_pid" > /dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Maven process still running, check logs for errors"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Maven process exited unexpectedly"
    fi

    return 1
}

# Get application PID
get_app_pid() {
    local port="${1:-$DEFAULT_PORT}"
    lsof -ti ":$port" 2>/dev/null
}

# Export functions for use in other scripts
export -f is_app_running
export -f stop_app
export -f start_app
export -f get_app_pid
