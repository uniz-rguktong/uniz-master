# Backups & restore drill

## What runs automatically

CronJobs in `infra/kubernetes/base/core/`:

- `uniz-postgres-backup` — daily dumps to `/var/backups/uniz/uniz-<service>_*.sql.gz` (~14 day retention)
- `uniz-uploads-backup` — uploads snapshot (same host path family)

## Vault

Production secrets live at `/root/uniz-secrets.env` (mode 600).

```bash
npm run vault:vps:status
npm run vault:vps-audit
# or on the VPS:
bash scripts/ops/vps-vault-remote.sh audit
```

Deploy prefers the existing vault (`UNIZ_USE_EXISTING_VAULT=true`) and syncs it into the `uniz-secrets` Kubernetes Secret.

## Restore drill (required quarterly)

On the VPS:

```bash
CONFIRM=1 SERVICE=auth bash /root/uniz-master-main/scripts/ops/postgres-restore-drill.sh
```

This creates `uniz_restore_drill`, loads the newest matching dump, runs `SELECT 1` + table counts, then leaves the DB for inspection. Drop when done:

```bash
dropdb -h 127.0.0.1 -U postgres uniz_restore_drill
```

## Off-box copy (VPS-only constraint)

Keep encrypted copies on a second local volume or USB when possible:

```bash
tar -C /var/backups -czf - uniz | openssl enc -aes-256-cbc -pbkdf2 -out uniz-backups-$(date +%F).tar.gz.enc
```

Store the passphrase in the vault (`BACKUP_OPENSSL_PASSPHRASE`), never in git.
