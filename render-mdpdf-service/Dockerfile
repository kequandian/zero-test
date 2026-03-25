# =============================================================================
# Stage 1: Rust Builder (Alpine with musl)
# =============================================================================
FROM rust:alpine AS rust-builder

# Install musl-dev for static linking
RUN apk add --no-cache musl-dev

WORKDIR /build

# Copy Cargo manifests
COPY Cargo.toml ./

# Copy source code
COPY src ./src

# Build release binary with musl target
RUN cargo build --release

# =============================================================================
# Stage 2: Node.js Runtime (Alpine)
# =============================================================================
FROM node:22-alpine

WORKDIR /app

# Install Chromium and runtime dependencies for mdpdf/puppeteer
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    fontconfig \
    freetype \
    libsoup \
    libxkbcommon \
    mesa-gl \
    nss \
    ttf-freefont \
    ttf-liberation \
    bash \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

# Configure Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy Node.js dependencies
COPY render-pdf-mdpdf/package.json render-pdf-mdpdf/package-lock.json ./render-pdf-mdpdf/

# Install npm dependencies (production only)
RUN cd render-pdf-mdpdf && \
    npm ci --production --no-optional && \
    npm cache clean --force

# Copy render-pdf-mdpdf source and assets
COPY render-pdf-mdpdf ./render-pdf-mdpdf

# Copy Rust binary from builder
COPY --from=rust-builder /build/target/release/render-mdpdf-service /usr/local/bin/render-mdpdf-service

# Create output and temp directories
RUN mkdir -p /app/output /app/tmp

# Set workspace root environment variable
ENV WORKSPACE_ROOT=/app

# Expose service port
EXPOSE 39090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:39090/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the service
CMD ["render-mdpdf-service"]
