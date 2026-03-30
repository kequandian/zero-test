#!/bin/bash
# =============================================================================
# Build script for render-mdpdf-service Docker image
# =============================================================================
# This script builds:
# 1. Rust release binary (glibc for Debian compatibility)
# 2. Node.js dependencies with Puppeteer Chromium
# 3. Docker image with all pre-built artifacts
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "render-mdpdf-service - Local Build Script"
echo "============================================================"
echo ""

# =============================================================================
# Step 1: Build Rust binary
# =============================================================================
echo "==> Step 1: Building Rust binary (glibc release)..."
cargo build --release

BINARY_PATH="$SCRIPT_DIR/target/release/render-mdpdf-service"
if [ ! -f "$BINARY_PATH" ]; then
    echo "Error: Binary not found at $BINARY_PATH"
    exit 1
fi

BINARY_SIZE=$(du -h "$BINARY_PATH" | cut -f1)
echo "    ✓ Binary built: $BINARY_PATH ($BINARY_SIZE)"
echo ""

# =============================================================================
# Step 2: Install Node.js dependencies
# =============================================================================
echo "==> Step 2: Installing Node.js dependencies..."
cd render-pdf-mdpdf

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "Error: package-lock.json not found"
    exit 1
fi

echo "    Running: npm install..."
npm install

# Verify mdpdf is installed
if ! npm list mdpdf &>/dev/null; then
    echo "Error: mdpdf not installed"
    exit 1
fi

echo "    ✓ Dependencies installed"
echo ""

# =============================================================================
# Step 3: Download Chromium (if not already present)
# =============================================================================
echo "==> Step 3: Checking Puppeteer Chromium..."
CHROMIUM_DIR="node_modules/puppeteer/.local-chromium/linux-722234"

if [ -d "$CHROMIUM_DIR" ]; then
    CHROMIUM_SIZE=$(du -sh "$CHROMIUM_DIR" 2>/dev/null | cut -f1)
    echo "    ✓ Chromium already downloaded ($CHROMIUM_SIZE)"
else
    echo "    Downloading Chromium (this may take a while)..."
    echo "    Using mirror: https://mirrors.huaweicloud.com/chromium-browser-snapshots"
    PUPPETEER_DOWNLOAD_HOST=https://mirrors.huaweicloud.com/chromium-browser-snapshots \
        node node_modules/puppeteer/install.js

    if [ ! -d "$CHROMIUM_DIR" ]; then
        echo "Warning: Chromium download may have failed"
        echo "The Docker image will use system Chromium as fallback"
    else
        echo "    ✓ Chromium downloaded"
    fi
fi

cd "$SCRIPT_DIR"
echo ""

# =============================================================================
# Step 4: Build Docker image
# =============================================================================
echo "==> Step 4: Building Docker image..."
echo "    Context size:"
du -sh . 2>/dev/null | head -1

IMAGE_NAME="${IMAGE_NAME:-render-mdpdf-service}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

docker build -t "$IMAGE_NAME:$IMAGE_TAG" .

echo ""
echo "============================================================"
echo "✓ Build complete!"
echo "============================================================"
echo ""
echo "Docker image: $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "Run with:"
echo "  docker run -d -p 39090:39090 --name mdpdf $IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "Test with:"
echo "  curl -X POST http://localhost:39090/api/mdpdf/render \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"markdown\": \"# Hello World\"}'"
echo ""
