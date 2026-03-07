---
description: Build, Deploy and Verify UniZ services on VPS (K3s)
---

// turbo-all

### 1. Synchronize Source Code

Push local changes to GitHub. The VPS will pull these changes during the deployment workflow.

```bash
git add . && git commit -m "infra: manual deployment pipeline" && git push origin main
```

### 2. Manual Deployment (GitHub Actions)

Trigger the deployment from the GitHub Web UI or CLI. This is the **preferred method** as it includes permission checks.

```bash
gh workflow run "Manual VPS Deployment" -f commit_message="Deploying bug fix"
```

### 3. Build & Deploy Logic (Atomic Safety)

The system uses a **Build-then-Deploy** strategy. Images are built directly on the VPS to ensure environment parity.

1.  **Build**: Script builds the Docker image.
2.  **Validation**: If the build fails, the script **aborts immediately** (does not deploy).
3.  **Deployment**: If success, images are imported to K3s image store and deployments are restarted.

```bash
# Scripted logic inside deploy.sh:
if docker build ...; then
  k3s ctr images import ...
else
  exit 1 # Abort
fi
```

### 4. Verify System Health

Run the comprehensive test suite against the Production API.

```bash
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin && \
BASE_URL=https://api.uniz.rguktong.in/api/v1 \
GW_STATUS_URL=https://api.uniz.rguktong.in/api/v1/system/health \
SKIP_OTP=true \
INTERNAL_SECRET=uniz-core \
MAP_LOCALHOST=false \
node infra/core-infra/tests/comprehensive_test.js
```

### 5. Load Testing & HPA Auto-Scaling

To rigorously verify that the Kubernetes Horizontal Pod Autoscaler (HPA) is functioning and successfully mitigating DDoS attacks, use the included npm scripts:

```bash
# Terminal 1: Watch the scaling metrics in real-time
npm run watch

# Terminal 2: Launch the attack simulation (200 concurrent connections, 90 seconds)
npm run attack
```

The HPA should detect average pod CPU spikes strictly over 40% and automatically provision up to 15 pods for the Gateway dynamically. Once the attack completes, it will enter a standard 5-minute `ScaleDownStabilized` cooldown period before gracefully dropping back down to 3 minimum replicas to conserve cluster resources.
