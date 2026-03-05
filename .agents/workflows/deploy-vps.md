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

```bash
# Recommended: Deploy with unique tags to bypass containerd caching
TAG=local-$(date +%s)
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "cd /root/uniz-master && \
docker build --no-cache -t <SERVICE_IMAGE>:$TAG apps/<SOURCE_DIR> && \
docker save <SERVICE_IMAGE>:$TAG | /usr/local/bin/k3s ctr images import - && \
kubectl set image deployment/<DEPLOYMENT_NAME> <CONTAINER_NAME>=<SERVICE_IMAGE>:$TAG"
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
