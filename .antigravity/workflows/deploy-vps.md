---
description: Build, Deploy and Verify UniZ services on VPS (K3s)
---

// turbo-all

### 1. Synchronize Source Code

Push local changes to Github and pull them on the VPS.

```bash
git add . && git commit -m "deploy: automated update" && git push origin main && \
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "cd /root/uniz-master && git pull origin main"
```

### 2. Build & Inject Image (K3s containerd)

Build the Docker image locally on the VPS and manually import it into the K3s logic.
Replace `<SERVICE_IMAGE>` (e.g., `uniz-user-service`) and `<SOURCE_DIR>` (e.g., `uniz-user`).

```bash
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "cd /root/uniz-master && docker build --no-cache -t <SERVICE_IMAGE>:local apps/<SOURCE_DIR> && docker save <SERVICE_IMAGE>:local | /usr/local/bin/k3s ctr images import -"
```

### 3. Restart K8s Deployment

Force Kubernetes to pick up the new image.

```bash
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "kubectl rollout restart deployment <DEPLOYMENT_NAME>"
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
