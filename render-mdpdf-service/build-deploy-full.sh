#!/bin/bash
# Complete build script: pull base images + build

set -e

K3S_PROXY="http://192.168.3.105:8080"
DIND_POD="docker-dind-856cb56c6b-whc42"
IMAGE_NAME="render-mdpdf-service"
IMAGE_TAG="latest"

echo "=========================================="
echo "Step 1: Pulling base images to k3s dind pod"
echo "=========================================="

# Pull and tag base images in dind pod
kubectl exec -it "$DIND_POD" -c docker-dind -- sh -exc "
    echo 'Pulling rust:1.94.0-alpine...'
    docker pull rust:1.94.0-alpine || docker pull rust:alpine

    echo 'Pulling node:22-alpine...'
    docker pull node:22-alpine || docker pull node:alpine

    echo 'Tagging for local registry...'
    docker tag rust:1.94.0-alpine registry.k3s.local/rust:1.94.0-alpine 2>/dev/null || docker tag rust:alpine registry.k3s.local/rust:1.94.0-alpine
    docker tag node:22-alpine registry.k3s.local/node:22-alpine 2>/dev/null || docker tag node:alpine registry.k3s.local/node:22-alpine

    echo 'Pushing to local registry...'
    docker push registry.k3s.local/rust:1.94.0-alpine || true
    docker push registry.k3s.local/node:22-alpine || true

    echo 'Base images ready!'
"

echo ""
echo "=========================================="
echo "Step 2: Creating source tar archive"
echo "=========================================="

tar -czf "/tmp/${IMAGE_NAME}-src.tar.gz" \
  --exclude='.git' \
  --exclude='target' \
  --exclude='output' \
  --exclude='tmp' \
  --exclude='*.tar.gz' \
  --exclude='node_modules' \
  .
echo "Tar created"

echo ""
echo "=========================================="
echo "Step 3: Submitting build to k3s-proxy"
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
echo "Step 4: Streaming build logs"
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
