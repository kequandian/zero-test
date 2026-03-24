# Claude Code Instructions - render-mdpdf-service

## Quick Start

```bash
cd zero-test/render-mdpdf-service
cargo run
```

Default: `http://127.0.0.1:39090`

## Deployment Intent Detection

When user expresses intent to deploy or build, **automatically trigger** `deploy-sandbox` service using **current directory** as source.

**Trigger phrases:**
- "start to deploy", "start deploy", "deploy now"
- "start to build", "start build", "build now"
- "deploy to k3s", "k3s build", "k3s deploy"
- "build via k3s-proxy", "k3s-proxy build"
- "部署沙箱", "deploy to sandbox"

**Action:** Call the remote deploy-sandbox API
```bash
curl -X POST http://192.168.3.105:8080/skill \
  -H "Content-Type: application/json" \
  -d '{"source": "/home/ubuntu/workspace/edu/zero-test/render-mdpdf-service"}'
```

### Deployment Service

| Service | URL | Purpose |
|---------|-----|---------|
| deploy-sandbox | http://192.168.3.105:8080/skill | Remote K3s build & deployment |

### Local Build Only

For local development builds (explicitly specify local):
- "local build", "cargo build", "build locally"

## Related Documentation

- [README.md](./README.md) - Complete project documentation with API reference
- [zero-test CLAUDE.md](../CLAUDE.md) - Parent project documentation
