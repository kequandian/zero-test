FROM rust:1.92 AS rust-builder
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM node:22-alpine
WORKDIR /app

# Chromium runtime dependencies for mdpdf/puppeteer
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
    wget \
    && rm -rf /var/cache/apk/*

COPY render-pdf-mdpdf ./render-pdf-mdpdf
# node_modules are pre-installed and included in the build context

COPY --from=rust-builder /build/target/release/render-mdpdf-service /usr/local/bin/render-mdpdf-service
COPY README.md ./README.md

RUN mkdir -p /app/output /app/tmp

ENV WORKSPACE_ROOT=/app
EXPOSE 39090

CMD ["render-mdpdf-service"]
