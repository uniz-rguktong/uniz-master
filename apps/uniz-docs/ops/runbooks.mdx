---
title: "Ops runbooks"
description: "Smoke checks, backups, pod inspection, common incidents — what to run and what healthy looks like."
---

## Post-deploy smoke

```bash
bash scripts/ops/post-deploy-smoke.sh
```

Expects:

- Portal + landing HTTP 200 (Pages)
- API reachable
- Outpass list **503** while gated
- Mail route present on notifications (403/400 without secret)

## Inspect cluster

```bash
kubectl get deploy,hpa,pods
kubectl logs -l app=uniz-gateway-api --tail=100
curl -sk https://api-uniz.rguktong.in/api/v1/system/health | jq
```

Healthy aggregate: `"status":"ok"`. If `files`/`mail` unhealthy, check ConfigMap URLs point at **user** / **notifications**, then `redis-cli DEL gateway:system_health_aggregate`.

## Backup Postgres

```bash
bash scripts/ops/backup-postgres.sh
```

## Common incidents

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Portal loads, API CORS error | `CLIENT_URL` missing Pages origin | Patch ConfigMap, restart gateway-api |
| Custom domain Verifying on Pages | DNS not CNAME to Pages | Run cutover DNS script |
| System health `down` but apps work | Stale Redis health / wrong FILES/MAIL URLs | Flush key + fix ConfigMap |
| Outpass 503 | Expected when flag false | [Revive](/howto/revive-outpass) if intentional |
| Deploy cancelled mid-run | `cancel-in-progress: true` on new push | Avoid pushing until run finishes |

## Useful scripts

| Script | Use |
|--------|-----|
| `scripts/ops/launch-readiness-check.sh` | Pre-launch checks |
| `scripts/ops/run-latency-suite.sh` | Latency |
| `scripts/ops/vps-storage-cleanup.sh` | Disk |
| `scripts/ops/migrate-grievances-to-user.sh` | One-time grievance copy |
| `scripts/ops/mint-student-token.sh` | Dev JWT helper |
