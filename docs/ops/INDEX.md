# UniZ ops index

Single-VPS + Cloudflare Pages (free) production.

| Topic | Doc / command |
|---|---|
| Deploy | [agent deploy-vps](../internal/agent-workflows/cursor-agents/deploy-vps.md) · `gh workflow run "VPS Automated Deployment"` |
| Frontend deploy | [CLOUDFLARE_FREE.md](CLOUDFLARE_FREE.md) · `gh workflow run "Deploy Frontends to Cloudflare Pages"` |
| Rollback | [ROLLBACK.md](ROLLBACK.md) |
| Smoke | `bash scripts/ops/post-deploy-smoke.sh` |
| HPA drill | [HPA_DRILL.md](HPA_DRILL.md) |
| Backups / restore | [BACKUP_RESTORE.md](BACKUP_RESTORE.md) |
| Database editor / Adminer | [adminer.md](adminer.md) |
| Vault | `npm run vault:vps:status` · `npm run vault:vps-audit` |
| Observability | See below (Netdata + Uptime Kuma via SSH tunnel) |
| Infra overview | [infra/README.md](../../infra/README.md) |
| GitHub governance | [github-governance.md](github-governance.md) |

## Observability (localhost only)

Netdata (`19999`) and Uptime Kuma (`3001`) bind `127.0.0.1` hostPorts — not public.

```bash
# From your laptop
ssh -L 19999:127.0.0.1:19999 -L 3001:127.0.0.1:3001 root@<vps>
# Then open http://127.0.0.1:19999/ and http://127.0.0.1:3001/
```

Seed / refresh monitors (portal, landing, API health, landing-api):

```bash
# On VPS (uses vault UPTIME_KUMA_* ; optional UPTIME_DISCORD_WEBHOOK)
bash scripts/ops/setup-uptime-monitors.sh
```

## Cluster inventory checklist

After deploy or cleanup:

```bash
kubectl get deploy,svc,hpa,cronjob -A
kubectl top nodes
kubectl top pods
kubectl describe node | sed -n '/Allocated resources/,/Events/p'
bash scripts/ops/post-deploy-smoke.sh
curl -fsS https://api-uniz.rguktong.in/api/v1/system/health | jq .
```

Expected always-on Deployments: `uniz-gateway-api`, `uniz-auth-service`, `uniz-user-service`, `uniz-academics-service`, `uniz-notification-service`, `uniz-redis`, `uniz-docs-service`, plus observability.

Parked at replicas 0 (rollback only): `uniz-portal`, `uniz-landing`, `uniz-gateway`, `uniz-outpass-service`.

Removed: legacy `uniz-api` (traffic is microservices via gateway-api).

Host publish (not on eth0): Postgres `127.0.0.1` + `10.42.0.1:5432`; landing API `127.0.0.1` + `10.42.0.1:8000`; landing DB `127.0.0.1:5433`. k8s Endpoints use `10.42.0.1` so pods can reach Docker without a public listener. Public surface: `22` / `80` / `443` only (UFW + `DOCKER-USER`).
