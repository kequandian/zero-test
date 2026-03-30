#!/bin/bash
# build-and-upload.sh - 打包源代码并通过 k3s-proxy multipart 上传构建

set -e

# ==================== 配置 ====================
K3S_PROXY_URL="${K3S_PROXY_URL:-http://192.168.3.105:8080}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-render-mdpdf-service}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
TAR_FILE="/tmp/${IMAGE_NAME}-source.tar.gz"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== K3s Proxy Build (Tar Upload) ===${NC}"
echo -e "${BLUE}Project:${NC} $PROJECT_DIR"
echo -e "${BLUE}Image:${NC} $IMAGE_NAME:$IMAGE_TAG"
echo -e "${BLUE}Proxy:${NC} $K3S_PROXY_URL"
echo ""

# ==================== 检查 k3s-proxy 服务 ====================
echo -e "${BLUE}步骤 1: 检查 k3s-proxy 服务${NC}"
HEALTH=$(curl -s "$K3S_PROXY_URL/health" 2>/dev/null || echo '{"status":"error"}')

if ! echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${RED}k3s-proxy 服务不健康${NC}"
    echo "$HEALTH"
    exit 1
fi

echo -e "${GREEN}✓ k3s-proxy 服务正常${NC}"
echo ""

# ==================== 打包源代码 ====================
echo -e "${BLUE}步骤 2: 打包源代码${NC}"
echo "工作目录: $PROJECT_DIR"

cd "$PROJECT_DIR"

# 清理旧文件
rm -f "$TAR_FILE"

# 创建 tar.gz 归档，排除不必要的文件
echo "创建归档..."
tar -czf "$TAR_FILE" \
    --exclude='.git' \
    --exclude='target' \
    --exclude='node_modules' \
    --exclude='.*' \
    --exclude='_*' \
    --exclude='output' \
    --exclude='tmp' \
    --exclude='*.log' \
    Dockerfile \
    Cargo.toml \
    Cargo.lock \
    src/ \
    render-pdf-mdpdf/ \
    README.md 2>/dev/null || true

# 检查文件是否创建成功
if [ ! -f "$TAR_FILE" ]; then
    echo -e "${RED}创建归档失败${NC}"
    exit 1
fi

FILE_SIZE=$(du -h "$TAR_FILE" | cut -f1)
echo -e "${GREEN}✓ 归档创建成功: $TAR_FILE ($FILE_SIZE)${NC}"
echo ""

# ==================== 显示归档内容 ====================
echo -e "${BLUE}归档内容预览:${NC}"
tar -tzf "$TAR_FILE" | head -20
echo "..."
echo ""

# ==================== 提交构建请求 ====================
echo -e "${BLUE}步骤 3: 上传并提交构建${NC}"

# 使用 multipart/form-data 上传
RESPONSE=$(curl -s -X POST "$K3S_PROXY_URL/build/upload" \
    -F "dockerfile=@$PROJECT_DIR/Dockerfile" \
    -F "source_tar=@$TAR_FILE" \
    -F "image_name=$IMAGE_NAME" \
    -F "image_tag=$IMAGE_TAG")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 提取 build_id
BUILD_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('build_id', ''))" 2>/dev/null)

if [ -z "$BUILD_ID" ]; then
    echo -e "${RED}无法获取 build_id${NC}"
    rm -f "$TAR_FILE"
    exit 1
fi

echo -e "${GREEN}✓ 构建已提交，ID: $BUILD_ID${NC}"
echo ""

# ==================== 监控构建状态 ====================
echo -e "${BLUE}步骤 4: 监控构建状态${NC}"
echo -e "${YELLOW}使用以下命令查看构建状态:${NC}"
echo -e "  curl -s $K3S_PROXY_URL/build/$BUILD_ID | python3 -m json.tool"
echo ""
echo -e "${YELLOW}使用以下命令流式查看构建日志:${NC}"
echo -e "  curl -N $K3S_PROXY_URL/events/$BUILD_ID"
echo ""

# 等待构建开始
sleep 2

# 检查构建状态
for i in {1..120}; do
    STATUS_RESPONSE=$(curl -s "$K3S_PROXY_URL/build/$BUILD_ID")
    STATUS=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'Unknown'))" 2>/dev/null)

    timestamp=$(date '+%H:%M:%S')
    echo -e "${timestamp} - 状态: ${BLUE}$STATUS${NC}"

    if [ "$STATUS" = "Completed" ]; then
        echo -e "${GREEN}✓ 构建成功完成${NC}"
        echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
        echo ""
        IMAGE_REF=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('image_reference', ''))" 2>/dev/null)
        if [ -n "$IMAGE_REF" ]; then
            echo -e "${GREEN}镜像: $IMAGE_REF${NC}"
            echo -e "${YELLOW}在 k3s 中使用: kubectl run test --image=$IMAGE_REF --restart=Never${NC}"
        fi
        rm -f "$TAR_FILE"
        exit 0
    fi

    if [ "$STATUS" = "Failed" ]; then
        echo -e "${RED}✗ 构建失败${NC}"
        echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
        ERROR=$(echo "$STATUS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', '未知错误'))" 2>/dev/null)
        echo -e "${RED}错误: $ERROR${NC}"
        rm -f "$TAR_FILE"
        exit 1
    fi

    sleep 5
done

echo -e "${YELLOW}构建仍在进行中，请使用上面的命令手动查看状态${NC}"
rm -f "$TAR_FILE"
