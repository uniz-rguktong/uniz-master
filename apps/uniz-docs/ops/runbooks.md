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
| Outpass 503 | Expected. The feature is not on. | Leave it. [Revive](/howto/revive-outpass) only if you intend to enable it. |
| Deploy cancelled mid-run | `cancel-in-progress: true` on new push | Avoid pushing until run finishes |

## Useful scripts

| Script | Use |
|--------|-----|
| `scripts/ops/launch-readiness-check.sh` | Pre-launch checks |
| `scripts/ops/run-latency-suite.sh` | Latency |
| `scripts/ops/vps-storage-cleanup.sh` | Disk |
| `scripts/ops/migrate-grievances-to-user.sh` | One-time grievance copy |
| `scripts/ops/mint-student-token.sh` | Dev JWT helper |

## Student password reset (already applied)

The one-off student reset has already been applied (2,711 student accounts). Each of those students must set a new password at the next sign-in, after an email code to the campus mailbox `<id>@rguktong.ac.in`. Previous student sessions no longer work (`tokenVersion` bumped, `mustChangePassword` set). Admin, webadmin, and the shared role accounts were not touched. Faculty `firstname.lastname` logins were not created. That is a later, separate step.

Script: `scripts/ops/login-revamp.js`. Dry-run is the default and writes nothing. Apply is not a routine action and should not be run again from this note. Workflow: `.github/workflows/login-revamp.yml`. Job manifest: `infra/kubernetes/base/core/login-revamp-job.yaml` (not wired into the core kustomization). The script never prints passwords. Do not add one here.
