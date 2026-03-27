#!/bin/bash
# =============================================================================
# Build and deploy script with pre-compiled musl binary
# =============================================================================
# This script:
# 1. Compiles Rust binary for musl target
# 2. Creates tar archive WITH the compiled binary
# 3. Submits to k3s-proxy for Docker build
# =============================================================================

set -e

K3S_PROXY="http://192.168.3.105:8080"
DIND_POD="docker-dind-856cb56c6b-whc42"
IMAGE_NAME="render-mdpdf-service"
IMAGE_TAG="latest"
TARGET_TRIPLE="x86_64-unknown-linux-musl"

echo "=========================================="
echo "Step 1: Installing musl target"
echo "=========================================="

rustup target add "$TARGET_TRIPLE"

echo ""
echo "=========================================="
echo "Step 2: Building Rust binary (musl static)"
echo "=========================================="

cargo build --release --target "$TARGET_TRIPLE"

# Verify binary exists
BINARY_PATH="target/${TARGET_TRIPLE}/release/render-mdpdf-service"
if [ ! -f "$BINARY_PATH" ]; then
    echo "ERROR: Binary not found at $BINARY_PATH"
    exit 1
fi

echo "✓ Binary built: $BINARY_PATH"
ls -lh "$BINARY_PATH"

echo ""
echo "=========================================="
echo "Step 3: Pulling base images to k3s dind pod"
echo "=========================================="

kubectl exec -it "$DIND_POD" -c docker-dind -- sh -exc "
    echo 'Pulling node:22-alpine...'
    docker pull node:22-alpine || docker pull node:alpine

    echo 'Tagging for local registry...'
    docker tag node:22-alpine registry.k3s.local/node:22-alpine 2>/dev/null || docker tag node:alpine registry.k3s.local/node:22-alpine

    echo 'Pushing to local registry...'
    docker push registry.k3s.local/node:22-alpine || true

    echo 'Base images ready!'
"

echo ""
echo "=========================================="
echo "Step 4: Creating source tar archive WITH musl binary"
echo "=========================================="

# Create tar with the musl binary
tar -czf "/tmp/${IMAGE_NAME}-src.tar.gz" \
  --exclude='.git' \
  --exclude='target/debug' \
  --exclude='target/*/debug' \
  --exclude='target/*/deps' \
  --exclude='target/*/build' \
  --exclude='target/*/incremental' \
  --exclude='output' \
  --exclude='tmp' \
  --exclude='*.tar.gz' \
  --exclude='node_modules' \
  "target/${TARGET_TRIPLE}/release/render-mdpdf-service" \
  .

echo "✓ Tar created with musl binary"

echo ""
echo "=========================================="
echo "Step 5: Submitting build to k3s-proxy"
echo "=========================================="

python3 << 'PYEOF'
import requests
import sys

try:
    with open('Dockerfile', 'rb') as df, open('/tmp/render-mdpdf-service-src.tar.gz', 'rb') as src:
        files = {
            'dockerfile': ('Dockerfile', df, 'text/plain'),
            'source_tar': ('source.tar.gz', src, 'application/gzip')
        }
        data = {
            'image_name': 'render-mdpdf-service',
            'image_tag': 'latest',
            'force': 'true'
        }

        resp = requests.post(
            'http://192.168.3.105:8080/build/upload',
            files=files,
            data=data,
            timeout=120
        )

        if resp.status_code == 200:
            result = resp.json()
            print(f"Build ID: {result['build_id']}")
            print(f"Status: {result['status']}")
            with open('/tmp/build_id.txt', 'w') as f:
                f.write(result['build_id'])
        else:
            print(f"Error: {resp.status_code} - {resp.text}", file=sys.stderr)
            sys.exit(1)
except Exception as e:
    print(f"Upload failed: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF

if [ $? -ne 0 ]; then
    echo "Build submission failed!"
    exit 1
fi

BUILD_ID=$(cat /tmp/build_id.txt)

echo ""
echo "=========================================="
echo "Step 6: Streaming build logs"
echo "=========================================="
echo "Build ID: $BUILD_ID"
echo ""

curl -N "http://192.168.3.105:8080/events/${BUILD_ID}"

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo "Image: registry.k3s.local/${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "To deploy:"
echo "  kubectl run ${IMAGE_NAME} --image=registry.k3s.local/${IMAGE_NAME}:${IMAGE_TAG} --port=39090"
