# =============================================================================
# render-mdpdf-service - Production Docker Image
# =============================================================================
# This Dockerfile uses pre-built artifacts to create a production-ready image.
# Build locally with: ./build-local.sh
# =============================================================================

FROM node:22-bookworm-slim

WORKDIR /app

# =============================================================================
# Runtime dependencies for mdpdf/puppeteer
# =============================================================================
# - chromium*: System Chromium and its dependencies
# - fonts*: Chinese and general font support
# - ca-certificates: HTTPS support
# =============================================================================
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    fonts-freefont-ttf \
    fonts-noto \
    fonts-noto-cjk \
    fonts-wqy-zenhei \
    ca-certificates \
    bash \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxtst6 \
    libxss1 \
    libxrandr2 \
    libxrender1 \
    libgbm1 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libexpat1 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libwayland-cursor0 \
    libwayland-egl1 \
    libxkbcommon0 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Copy pre-built Node.js dependencies (including Puppeteer with Chromium)
# =============================================================================
# This includes ~350MB of Chromium binary, so the image will be large.
# Alternative: Set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true to use system chromium
# =============================================================================
COPY render-pdf-mdpdf/package.json render-pdf-mdpdf/package-lock.json ./render-pdf-mdpdf/
COPY render-pdf-mdpdf/node_modules ./render-pdf-mdpdf/node_modules

# =============================================================================
# Copy render-pdf-mdpdf source and assets
# =============================================================================
COPY render-pdf-mdpdf/scripts ./render-pdf-mdpdf/scripts
COPY render-pdf-mdpdf/assets ./render-pdf-mdpdf/assets

# =============================================================================
# Copy pre-built Rust binary (glibc for Debian compatibility)
# =============================================================================
COPY target/release/render-mdpdf-service /usr/local/bin/render-mdpdf-service

# =============================================================================
# Create output and temp directories
# =============================================================================
RUN mkdir -p /app/output /app/tmp

# =============================================================================
# Environment variables
# =============================================================================
# WORKSPACE_ROOT: Service root path (used by Rust binary)
# PUPPETEER_EXECUTABLE_PATH: Optional - use system Chromium as fallback
# =============================================================================
ENV WORKSPACE_ROOT=/app

# =============================================================================
# Service configuration
# =============================================================================
EXPOSE 39090

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:39090/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# =============================================================================
# Run the service
# =============================================================================
CMD ["render-mdpdf-service"]
