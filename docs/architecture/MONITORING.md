# UniZ Monitoring (lean)

Keep monitoring boring and actionable for a single-campus VPS.

## Live checks

```bash
kubectl get pods,hpa
kubectl top pods 2>/dev/null || true
kubectl logs -f -l app=uniz-gateway-api --tail=100
kubectl logs -f -l app=uniz-academics-service --tail=100
kubectl logs -f -l app=uniz-notification-service --tail=100
```

## After every deploy

```bash
bash scripts/ops/post-deploy-smoke.sh
```

CI also runs smoke after a successful VPS deploy (warn-only if a check fails).

## Background jobs

- Outpass maintenance CronJob (`uniz-maintenance-job`) — daily 02:00
- Storage cleanup CronJob — daily 03:00
- Postgres backup CronJob — suspended until hostPath is wired; use `scripts/ops/backup-postgres.sh` meanwhile

```bash
kubectl get cronjobs
kubectl get jobs --sort-by=.metadata.creationTimestamp | tail
```

## Error signals to watch

| Signal | Likely cause |
|--------|--------------|
| Gateway `502 Upstream Service Unreachable` | Pod crash / OOM / bad URL in ConfigMap |
| Academics 5xx during Excel upload | Validation failure or DB pressure — check upload errors in portal |
| Mail OTP fails | SES credentials / notifications pod (comms) |
| Redis connection errors | Shared Redis down — gateway cache + BullMQ |

## Optional next step

Wire Sentry (or similar) DSN into gateway-api + portal for aggregating 5xx. Not required for lean production if kubectl logs + smoke are run after deploys.
