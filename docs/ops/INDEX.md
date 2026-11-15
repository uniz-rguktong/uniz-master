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
| Vault | `npm run vault:vps:status` · `npm run vault:vps-audit` |
| Observability | `kubectl apply -k infra/kubernetes/base/observability` (Netdata + Uptime Kuma) |
| Infra overview | [infra/README.md](../../infra/README.md) |
| GitHub governance | [github-governance.md](github-governance.md) |
