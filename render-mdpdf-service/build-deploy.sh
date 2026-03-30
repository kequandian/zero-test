#!/bin/bash
# Single-script build and deploy to k3s-proxy

set -e

# Configuration
K3S_PROXY="http://192.168.3.105:8080"
IMAGE_NAME="render-mdpdf-service"
IMAGE_TAG="latest"
SRC_TAR="/tmp/${IMAGE_NAME}-src.tar.gz"

echo "=== Step 1: Creating source tar archive ==="
tar -czf "$SRC_TAR" \
  --exclude='.git' \
  --exclude='target' \
  --exclude='output' \
  --exclude='tmp' \
  --exclude='*.tar.gz' \
  --exclude='node_modules' \
  .
echo "✓ Tar created: $SRC_TAR"

echo ""
echo "=== Step 2: Submitting build to k3s-proxy ==="

# Use Python for reliable multipart upload
python3 << PYTHON_EOF
import requests
import sys
import json

try:
    with open('Dockerfile', 'rb') as df, open('$SRC_TAR', 'rb') as src:
        files = {
            'dockerfile': ('Dockerfile', df, 'text/plain'),
            'source_tar': ('source.tar.gz', src, 'application/gzip')
        }
        data = {
            'image_name': '$IMAGE_NAME',
            'image_tag': '$IMAGE_TAG'
        }

        print(f"Uploading to ${K3S_PROXY}/build/upload...")
        response = requests.post(
            '${K3S_PROXY}/build/upload',
            files=files,
            data=data,
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✓ Build submitted successfully!")
            print(f"  Build ID: {result.get('build_id')}")
            print(f"  Status: {result.get('status')}")

            # Save build_id for monitoring
            with open('/tmp/build_id.txt', 'w') as f:
                f.write(result.get('build_id', ''))
        else:
            print(f"✗ Upload failed: HTTP {response.status_code}", file=sys.stderr)
            print(response.text, file=sys.stderr)
            sys.exit(1)

except requests.exceptions.RequestException as e:
    print(f"✗ Network error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "✗ Build submission failed"
    exit 1
fi

BUILD_ID=$(cat /tmp/build_id.txt)

echo ""
echo "=== Step 3: Streaming build logs ==="
echo "Build ID: $BUILD_ID"
echo "Press Ctrl+C to stop watching (build continues on server)"
echo ""

# Stream build events via SSE
curl -N "${K3S_PROXY}/events/${BUILD_ID}" &
CURL_PID=$!

# Wait for user to stop watching, or check completion
wait $CURL_PID 2>/dev/null || true

echo ""
echo "=== Build complete ==="
echo "Check status: curl -s ${K3S_PROXY}/images | jq"
