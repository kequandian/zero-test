#!/bin/bash
# build-via-k3s-proxy.sh - 通过 k3s-proxy HTTP API 构建 Docker 镜像

set -e

# ==================== 配置 ====================
K3S_PROXY_URL="${K3S_PROXY_URL:-http://192.168.3.105:8080}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-render-mdpdf-service}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== K3s Proxy Docker Build ===${NC}"
echo -e "${BLUE}Project:${NC} $PROJECT_DIR"
echo -e "${BLUE}Image:${NC} $IMAGE_NAME:$IMAGE_TAG"
echo -e "${BLUE}Proxy:${NC} $K3S_PROXY_URL"
echo ""

# ==================== 检查 k3s-proxy 服务 ====================
echo -e "${BLUE}步骤 1: 检查 k3s-proxy 服务${NC}"
HEALTH=$(curl -s "$K3S_PROXY_URL/health" 2>/dev/null || echo '{"status":"error"}')
echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"

if ! echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${RED}k3s-proxy 服务不健康${NC}"
    exit 1
fi
echo -e "${GREEN}✓ k3s-proxy 服务正常${NC}"
echo ""

# ==================== 准备构建数据 ====================
echo -e "${BLUE}步骤 2: 准备构建数据${NC}"

# 读取 Dockerfile
DOCKERFILE_CONTENT=$(cat "$PROJECT_DIR/Dockerfile")

# 读取 Cargo.toml 和 Cargo.lock
CARGO_TOML=$(cat "$PROJECT_DIR/Cargo.toml")
CARGO_LOCK=$(cat "$PROJECT_DIR/Cargo.lock")

# 读取 src/main.rs
SRC_MAIN_RS=$(cat "$PROJECT_DIR/src/main.rs")

# 读取 render-pdf-mdpdf/package.json
PACKAGE_JSON=$(cat "$PROJECT_DIR/render-pdf-mdpdf/package.json")

# 读取 render-pdf-mdpdf/scripts/render.js
RENDER_JS=$(cat "$PROJECT_DIR/render-pdf-mdpdf/scripts/render.js")

# 读取 render-pdf-mdpdf/scripts/pdf-converter.js
PDF_CONVERTER_JS=$(cat "$PROJECT_DIR/render-pdf-mdpdf/scripts/pdf-converter.js")

# 读取 CSS 文件
MARKDOWN_CSS=$(cat "$PROJECT_DIR/render-pdf-mdpdf/assets/markdown-pdf.css")

# 读取 README.md
README_MD=$(cat "$PROJECT_DIR/README.md" 2>/dev/null || echo "# render-mdpdf-service")

echo -e "${GREEN}✓ 文件读取完成${NC}"
echo ""

# ==================== 构建 JSON 请求 ====================
echo -e "${BLUE}步骤 3: 构建构建请求${NC}"

# 构建 context_files JSON
CONTEXT_FILES=$(jq -n \
    --arg dockerfile "$DOCKERFILE_CONTENT" \
    --arg cargo_toml "$CARGO_TOML" \
    --arg cargo_lock "$CARGO_LOCK" \
    --arg main_rs "$SRC_MAIN_RS" \
    --arg package_json "$PACKAGE_JSON" \
    --arg render_js "$RENDER_JS" \
    --arg pdf_converter "$PDF_CONVERTER_JS" \
    --arg markdown_css "$MARKDOWN_CSS" \
    --arg readme "$README_MD" \
    '{
        "Dockerfile": $dockerfile,
        "Cargo.toml": $cargo_toml,
        "Cargo.lock": $cargo_lock,
        "src/main.rs": $main_rs,
        "render-pdf-mdpdf/package.json": $package_json,
        "render-pdf-mdpdf/scripts/render.js": $render_js,
        "render-pdf-mdpdf/scripts/pdf-converter.js": $pdf_converter,
        "render-pdf-mdpdf/assets/markdown-pdf.css": $markdown_css,
        "README.md": $readme
    }')

# 构建完整请求
BUILD_REQUEST=$(jq -n \
    --arg dockerfile "$DOCKERFILE_CONTENT" \
    --arg name "$IMAGE_NAME" \
    --arg tag "$IMAGE_TAG" \
    --argjson context "$CONTEXT_FILES" \
    '{
        dockerfile: $dockerfile,
        image_name: $name,
        image_tag: $tag,
        context_files: $context
    }')

echo -e "${GREEN}✓ 构建请求准备完成${NC}"
echo ""

# ==================== 提交构建请求 ====================
echo -e "${BLUE}步骤 4: 提交构建请求${NC}"

RESPONSE=$(curl -s -X POST "$K3S_PROXY_URL/build" \
    -H "Content-Type: application/json" \
    -d "$BUILD_REQUEST")

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# 提取 build_id
BUILD_ID=$(echo "$RESPONSE" | jq -r '.build_id // empty')

if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
    echo -e "${RED}无法获取 build_id${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建已提交，ID: $BUILD_ID${NC}"
echo ""

# ==================== 监控构建状态 ====================
echo -e "${BLUE}步骤 5: 监控构建状态${NC}"
echo -e "${YELLOW}使用以下命令查看构建状态:${NC}"
echo -e "  curl -s $K3S_PROXY_URL/build/$BUILD_ID | jq ."
echo ""
echo -e "${YELLOW}使用以下命令流式查看构建日志:${NC}"
echo -e "  curl -N $K3S_PROXY_URL/events/$BUILD_ID"
echo ""

# 等待构建开始
sleep 2

# 检查构建状态
for i in {1..60}; do
    STATUS_RESPONSE=$(curl -s "$K3S_PROXY_URL/build/$BUILD_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status // "Unknown"')

    echo -e "$(date '+%H:%M:%S') - 状态: ${BLUE}$STATUS${NC}"

    if [ "$STATUS" = "Completed" ]; then
        echo -e "${GREEN}✓ 构建成功完成${NC}"
        echo "$STATUS_RESPONSE" | jq .
        exit 0
    fi

    if [ "$STATUS" = "Failed" ]; then
        echo -e "${RED}✗ 构建失败${NC}"
        echo "$STATUS_RESPONSE" | jq .
        exit 1
    fi

    sleep 5
done

echo -e "${YELLOW}构建仍在进行中，请使用上面的命令手动查看状态${NC}"
