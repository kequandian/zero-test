# Claude Code Instructions - render-mdpdf-service

## Quick Start

```bash
cd zero-test/render-mdpdf-service
cargo run
```

Default: `http://127.0.0.1:39090`

## Deployment Intent Detection

When user expresses intent to deploy or build, **use k3s-proxy's remote skill endpoint**.

**CRITICAL:** DO NOT look for local `deploy-sandbox` script. The k3s-proxy service provides a `/skill` endpoint that returns complete build instructions.

### Remote Skill Workflow

1. **Fetch skill definition from k3s-proxy:**
   ```bash
   curl -s http://192.168.3.105:8080/skill
   ```

2. **Follow the skill documentation** returned by the endpoint to execute builds

3. **DO NOT attempt to run:** `~/.claude/skills/deploy-sandbox/deploy-sandbox.sh` (does not exist)

**Trigger phrases:**
- "start to deploy", "start deploy", "deploy now"
- "start to build", "start build", "build now"
- "deploy to k3s", "k3s build", "k3s deploy"
- "build via k3s-proxy", "k3s-proxy build"
- "部署沙箱", "deploy to sandbox"

**Action:**
1. Fetch skill from `http://192.168.3.105:8080/skill`
2. Parse and follow the skill's API usage instructions
3. Execute build via k3s-proxy HTTP API

### k3s-proxy Build Methods

**IMPORTANT:** The remote k3s-proxy service **does NOT support local source code paths** as parameters. Source code must be transmitted via one of these methods:

1. **Tar Archive Upload** (recommended for local builds) - Package source as `.tar.gz` and upload via multipart form
2. **Git Repository** - Specify a public git repository URL with optional subdirectory

**CRITICAL:** When tar upload fails, **DO NOT fall back to git repository**. Report the error and terminate.

### Method 1: Tar Archive Upload (Local Source)

```bash
# 1. Create source tar (excluding unnecessary files and node_modules)
tar -czf /tmp/render-mdpdf-src.tar.gz \
  --exclude='.git' \
  --exclude='target' \
  --exclude='output' \
  --exclude='tmp' \
  --exclude='*.tar.gz' \
  --exclude='node_modules' \
  .

# 2. Submit build request via Python (reliable multipart upload)
python3 << 'EOF'
import requests

files = {
    'dockerfile': ('Dockerfile', open('Dockerfile', 'rb')),
    'source_tar': ('source.tar.gz', open('/tmp/render-mdpdf-src.tar.gz', 'rb'), 'application/gzip')
}
data = {
    'image_name': 'render-mdpdf-service',
    'image_tag': 'latest'
}

response = requests.post(
    'http://192.168.3.105:8080/build/upload',
    files=files,
    data=data
)
print(response.text)
EOF

# 3. Monitor build status (use returned build_id)
curl -N http://192.168.3.105:8080/events/{build_id}
```

**Note:** Python `requests` library is recommended over `curl` for multipart upload due to better handling of binary data.

### Method 2: Git Repository Source

```bash
# Use Python to properly escape Dockerfile content
python3 << 'EOF'
import json
import subprocess

with open('Dockerfile', 'r') as f:
    dockerfile = f.read()

payload = {
    "dockerfile": dockerfile,
    "source_repo": {
        "url": "https://github.com/kequandian/zero-test.git",
        "branch": "master",
        "subdirectory": "render-mdpdf-service"
    },
    "image_name": "render-mdpdf-service",
    "image_tag": "latest"
}

result = subprocess.run([
    'curl', '-s', '-X', 'POST', 'http://192.168.3.105:8080/build',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(payload)
], capture_output=True, text=True)

print(result.stdout)
EOF
```

### Deployment Service

| Service | URL | Purpose |
|---------|-----|---------|
| k3s-proxy skill | http://192.168.3.105:8080/skill | Fetch skill documentation |
| k3s-proxy build | http://192.168.3.105:8080/build | Submit JSON build request |
| k3s-proxy upload | http://192.168.3.105:8080/build/upload | Multipart tar upload |
| k3s-proxy events | http://192.168.3.105:8080/events/{build_id} | Stream build logs (SSE) |

### Remote Skill Endpoint

The k3s-proxy `/skill` endpoint returns complete documentation for using the build service:

```bash
# Fetch complete skill documentation
curl -s http://192.168.3.105:8080/skill | less
```

This endpoint provides:
- API usage examples (JSON build, multipart upload, git repo)
- Build constraints and error handling
- SSE event streaming format
- Image/container query operations
- Troubleshooting guide

**Always fetch current skill documentation before executing builds** as the API may evolve.

### Build Constraints

| Constraint | Description |
|------------|-------------|
| Local paths | NOT supported - must use tar upload or git repo |
| Tar format | Must be `.tar.gz` (gzip compressed) |
| File size | Large tars may timeout; use multipart upload |
| Git access | Repository must be accessible from k3s cluster |

### Error Handling

**If build API returns:**
- `404 Not Found` → **Terminate** build with error: "k3s-proxy service endpoint not found"
- `405 Method Not Allowed` → **Terminate** build with error: "k3s-proxy API method mismatch"
- No response / timeout → **Terminate** build with error: "k3s-proxy service unreachable"
- Multipart upload `VALIDATION_ERROR` → **Terminate** build with error details
- Other errors → **Terminate** build with error details

**Multipart Upload Error Patterns:**
| Error Pattern | Likely Cause |
|--------------|--------------|
| `IncompleteFieldData` | Multipart data stream was incomplete |
| `FieldSizeExceeded` | Uploaded field exceeds size limit (default: 2MB) |
| `StreamSizeExceeded` | Total request body exceeds limit |
| `failed to read stream` | Network interrupted or file corrupted |

**DO NOT:**
- Fall back to manual `ssh`/`kubectl` commands
- Attempt alternative build methods
- Fall back to git repository when tar upload fails
- Continue with partial workarounds

**Action on error:** Report the failure to user with specific error message and await further instructions.

### Local Build Only

For local development builds (explicitly specify local):
- "local build", "cargo build", "build locally"

```bash
# Local build (not using k3s)
cargo build --release
./target/release/render-mdpdf-service
```

### Non-Existent Local Skills

The following skills are **NOT** available as local scripts:
- `deploy-sandbox` - Use k3s-proxy `/skill` endpoint instead
- `k3s-docker-build` - Use k3s-proxy HTTP API instead

When deployment intent is detected, **always** fetch skill documentation from:
```
http://192.168.3.105:8080/skill
```

## Related Documentation

- [README.md](./README.md) - Complete project documentation with API reference
- [zero-test CLAUDE.md](../CLAUDE.md) - Parent project documentation
