FROM rust:1.86-bookworm AS rust-builder
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM node:20-bookworm-slim
WORKDIR /app

# Chromium runtime dependencies for mdpdf/puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

COPY render-pdf-mdpdf ./render-pdf-mdpdf
RUN cd render-pdf-mdpdf && npm install --omit=dev

COPY --from=rust-builder /build/target/release/render-mdpdf-service /usr/local/bin/render-mdpdf-service
COPY README.md ./README.md

RUN mkdir -p /app/output /app/tmp

ENV WORKSPACE_ROOT=/app
EXPOSE 39090

CMD ["render-mdpdf-service"]
