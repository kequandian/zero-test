#!/bin/bash
# =============================================================================
# Build script for render-pdf-mdpdf Node.js project
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_PROJECT_DIR="$SCRIPT_DIR/render-pdf-mdpdf"

echo "============================================================"
echo "render-pdf-mdpdf - Node.js Build Script"
echo "============================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Install Node.js from https://nodejs.org/"
    exit 1
fi

echo "==> Node.js version:"
node --version
echo "==> npm version:"
npm --version
echo ""

# Navigate to node project directory
cd "$NODE_PROJECT_DIR"
echo "==> Working directory: $NODE_PROJECT_DIR"
echo ""

# Install dependencies
echo "==> Installing npm dependencies..."
npm install

echo ""
echo "============================================================"
echo "✓ Build complete!"
echo "============================================================"
echo ""
echo "Installed packages:"
npm list --depth=0
echo ""
echo "Usage:"
echo ""
echo "  # === Quick Test (from project root) ==="
echo "  node render-pdf-mdpdf/scripts/render.js --string '# Hello' - \$(pwd)/output.pdf"
echo ""
echo "  # === Convert markdown file ==="
echo "  node render-pdf-mdpdf/scripts/render.js README.md \$(pwd)/README.pdf"
echo ""
echo "  # === With custom CSS ==="
echo "  node render-pdf-mdpdf/scripts/render.js doc.md \$(pwd)/doc.pdf --css render-pdf-mdpdf/assets/markdown-pdf.css"
echo ""
echo "  # === From render-pdf-mdpdf directory ==="
echo "  cd render-pdf-mdpdf"
echo "  node scripts/render.js --string '# Hello' - \$(pwd)/output.pdf"
echo ""
echo "IMPORTANT: Always use absolute paths (\$(pwd)/filename) for output files!"
echo "           Relative paths cause Puppeteer file:// URL errors"
echo ""
