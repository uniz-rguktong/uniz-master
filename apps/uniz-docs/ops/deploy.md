---
title: "VPS deploy (CI → GHCR → K3s)"
description: "How backend images are built and rolled out — GitHub Actions deploy.yml, plan matrix, self-hosted runner, smoke."
---

## Pipeline

```mermaid
flowchart LR
  Push[push main] --> CI[Build monorepo]
  CI --> Plan[plan-build matrix]
  Plan --> Build[Build/push GHCR images]
  Build --> VPS[Self-hosted runner deploy]
  VPS --> Kustomize[kubectl apply / set image]
  Kustomize --> Smoke[post-deploy-smoke.sh]
  Smoke --> Park[Scale parked Deployments to 0]
```

| Workflow | File |
|----------|------|
| PR checks | `.github/workflows/ci.yml` |
| Production VPS | `.github/workflows/deploy.yml` |
| Frontends | `.github/workflows/deploy-cloudflare-pages.yml` |

## Key scripts

| Script | Role |
|--------|------|
| `scripts/ci/ci-plan-build-matrix.sh` | Decide which images to rebuild |
| `scripts/ci/ci-build-*.sh` | Docker build → GHCR |
| `scripts/ci/ci-remote-deploy.sh` | On-VPS pull + rollout + park replicas |
| `scripts/deploy/deploy.sh` | Core deploy orchestration |
| `scripts/deploy/sync-k8s-secret-from-vault.sh` | Unescape vault + rewrite PG host for pods (`10.42.0.1`) |
| `scripts/deploy/prisma-migrate-deploy-all.sh` | Migrate via `127.0.0.1` on the VPS host |
| `scripts/deploy/ensure-nginx-api-uniz.sh` | Persist `api-uniz` nginx → Traefik `:30620` |
| `scripts/ops/post-deploy-smoke.sh` | HTTP smoke (portal, API, outpass 503) |

## What gets deployed

Changed services rebuild as GHCR images `ghcr.io/uniz-rguktong/...`. Kustomize under `infra/kubernetes/base/` is applied; image tags updated on Deployments.

## Manual / emergency

```bash
# On VPS (with kubeconfig)
kubectl get deploy,hpa
kubectl rollout status deploy/uniz-gateway-api
bash scripts/ops/post-deploy-smoke.sh
```

## After every successful deploy

`ci-remote-deploy.sh` forces replicas **0** for mail, files, cron Deploy, outpass, portal, landing, and nginx gateway — so old manifests cannot leave them running.
