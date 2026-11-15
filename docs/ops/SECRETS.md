# Secrets surface (VPS-first)

## Sources of truth

| Layer | What |
|---|---|
| **VPS vault** `/root/uniz-secrets.env` | Runtime secrets for k3s pods (preferred on every deploy) |
| **k8s Secret** `uniz-secrets` | Synced from the vault by `scripts/deploy/sync-k8s-secret-from-vault.sh` |
| **GitHub Actions secrets** | Bootstrap/fallback + **Vite build-time** vars for GHCR/Pages (`VITE_*`, Cloudinary, Turnstile site key) |

## Deploy behavior

`UNIZ_USE_EXISTING_VAULT=true` (default on the VPS runner):

1. Reuse `/root/uniz-secrets.env` when present and non-empty.
2. Sync into `Secret/uniz-secrets`.
3. Only call `render-vps-secrets.sh` when the vault is missing or `UNIZ_USE_EXISTING_VAULT=false`.

## Updating production secrets

```bash
# On laptop (masked)
npm run vault:vps -- show JWT_SECURITY_KEY

# Prefer editing on the VPS, then:
bash scripts/deploy/sync-k8s-secret-from-vault.sh
kubectl rollout restart deploy/uniz-gateway-api deploy/uniz-auth-service
```

Keep GitHub secrets in sync only when CI image builds need new `VITE_*` values.
