---
description: Build, Deploy and Verify UniZ services on VPS (K3s)
---

// turbo-all

### 1. Synchronize Source Code

Push (or merge) to `main`. The VPS self-hosted runner checks out that SHA during deploy.

### 2. Manual Deployment (GitHub Actions)

Preferred — includes compile gate, GHCR builds, and post-deploy smoke.

```bash
# Normal deploy of current main tip
gh workflow run "VPS Automated Deployment" -f commit_message="manual deploy"

# Full rebuild of every image
gh workflow run "VPS Automated Deployment" -f force_rebuild=true -f commit_message="rebuild all"

# Frontends (Cloudflare Pages)
gh workflow run "Deploy Frontends to Cloudflare Pages" -f target=all
```

### 3. Build & Deploy Logic

1. **CI compile** on GitHub-hosted runners.
2. **Plan** which GHCR images changed (or all if `force_rebuild`).
3. **Build/push** images in parallel.
4. **Deploy** on the VPS self-hosted runner (`scripts/ci/ci-local-deploy.sh` → `deploy.sh`).
5. **Smoke** (`scripts/ops/post-deploy-smoke.sh`) — required; failure fails the run.

### 4. Verify System Health

```bash
bash scripts/ops/post-deploy-smoke.sh
```

Optional deeper suite:

```bash
BASE_URL=https://api-uniz.rguktong.in/api/v1 \
GW_STATUS_URL=https://api-uniz.rguktong.in/api/v1/system/health \
SKIP_OTP=true MAP_LOCALHOST=false \
node infra/tests/comprehensive_test.js
```

### 5. Load Testing & HPA (single 4-vCPU / 15Gi VPS)

Live HPA caps (see `infra/kubernetes/base/core/*`):

| Deployment | min→max | CPU target |
|---|---|---|
| uniz-gateway-api | 1→3 | 45% |
| uniz-auth-service | 1→2 | 50% |
| uniz-user-service | 1→3 | 70% |
| uniz-academics-service | 1→3 | 70% |
| uniz-notification-service | 1→2 | 70% |

```bash
# Terminal 1
npm run watch

# Terminal 2 — capped read-only health load
CONFIRM=1 CONCURRENCY=80 DURATION_SEC=90 bash scripts/ops/test-hpa-autoscale.sh
```

Scale-down uses a ~5 minute stabilization window. On one node, desired replicas may exceed schedulable capacity — deploy accepts ≥1 ready with a warning.
