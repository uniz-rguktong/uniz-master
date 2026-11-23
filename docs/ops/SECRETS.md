# Secrets surface (VPS-first)

Production secrets live on the VPS as an encrypted SOPS file, `/root/uniz-secrets.env.sops`. Do not commit plaintext or ciphertext; the repo must never hold either, or any keys.

## Getting started

New maintainers:

1. You need SSH access via the `uniz-vps` alias (key auth).
2. Run `scripts/secrets-onboard.sh` (macOS can `brew install sops age`). Private key stays at `~/.config/uniz/age.key` (600). Send only the public key to an admin.
3. Admin runs `scripts/secrets-grant.sh age1...`.
4. Run `scripts/secrets-pull.sh` (writes ./secrets.env, 600) or `--names` for key names only. The VPS only sends the encrypted file.

Follow-up: a separate dev/staging vault is not split yet; today's file is production, so treat a pulled `secrets.env` as production-sensitive.

## Sources of truth

| Layer | What |
|---|---|
| **VPS vault** `/root/uniz-secrets.env.sops` | Encrypted production secrets. Deploy decrypts this when the file and the `sops` binary are both present. |
| **Plaintext fallback** `/root/uniz-secrets.env` | Used when the SOPS file or the `sops` binary is missing. Mode 600. |
| **k8s Secret** `uniz-secrets` | Synced from the vault by `scripts/deploy/sync-k8s-secret-from-vault.sh` |
| **GitHub Actions secrets** | Bootstrap/fallback + **Vite build-time** vars for GHCR/Pages (`VITE_*`, Cloudinary, Turnstile site key) |

`CLOUDFLARE_TUNNEL_TOKEN` is intentionally empty in the vault and in `uniz-secrets`. Leave it empty. Deploy scales in-cluster cloudflared to 2 replicas when that value is set. See [cloudflared-pods.md](cloudflared-pods.md).

## Deploy behavior

`UNIZ_USE_EXISTING_VAULT=true` (default on the VPS runner):

1. Prefer `/root/uniz-secrets.env.sops`. Decrypt it to a mode-600 temp file, sync, then shred the temp file.
2. Otherwise reuse `/root/uniz-secrets.env` when present and non-empty.
3. Sync into `Secret/uniz-secrets`.
4. Only call `render-vps-secrets.sh` when the vault is missing or `UNIZ_USE_EXISTING_VAULT=false`.

The rendered Kubernetes secret manifest is applied from a mode-600 temp file. Deploy does not write `infra/kubernetes/base/shared/secrets.yaml` into the git work tree.

## Updating production secrets

```bash
# On laptop (masked)
npm run vault:vps -- show JWT_SECURITY_KEY

# Prefer editing on the VPS, then:
bash scripts/deploy/sync-k8s-secret-from-vault.sh
kubectl rollout restart deploy/uniz-gateway-api deploy/uniz-auth-service
```

Keep GitHub secrets in sync only when CI image builds need new `VITE_*` values.
