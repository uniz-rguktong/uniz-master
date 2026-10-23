# Secrets — open-source safe

UniZ is a **public campus repo**. Students contribute code; they must **never** need (or receive) production secrets.

## Rules (non-negotiable)

1. **Never commit** real secrets. Gitignored: `secrets.env`, `secrets.env.vps.backup`, `apps/*/.env`, `.env`.
2. **Repo only has placeholders** in `secrets.env.example` and `.env.example` (local demo values).
3. **Production secrets live only on the VPS** at `/root/uniz-secrets.env` (mode `600`, root-owned) and in **GitHub Actions encrypted secrets** (for CI/Pages/deploy).
4. **Kubernetes `uniz-secrets`** is populated **from the VPS vault file** during deploy — not from the git tree.
5. **ConfigMaps** may hold non-secret URLs/flags only. JWT keys, DB passwords, AWS keys, VAPID private keys, SMTP passwords → Secret / vault only.

## Who needs what

| Role | What they use |
|------|----------------|
| Student contributor | `cp secrets.env.example secrets.env` — local placeholders; `make up` / `npm run setup:local` |
| Maintainer (deploy) | GitHub Actions secrets + SSH to VPS; never paste prod keys into PRs/issues/chat |
| Ops on VPS | `/root/uniz-secrets.env` → synced into K8s `Secret/uniz-secrets` |

## Local (contributors)

```bash
cp secrets.env.example secrets.env   # already gitignored
npm run setup:local                  # syncs into service .env files for hot-reload
# or: make up && make seed           # Compose demo — no VPS access
```

Do **not** ask maintainers for production `JWT_SECURITY_KEY`, DB URLs, or AWS keys.

## Production vault (VPS)

| Path | Purpose |
|------|---------|
| `/root/uniz-secrets.env` | Canonical KEY=value vault (chmod 600) |
| `/var/log/uniz-vault-access.log` | Audit log when someone `reveal`s a key |
| K8s `Secret/uniz-secrets` | Runtime env for pods (synced by deploy) |

### Retrieve / inspect (maintainers only)

From a laptop with deploy SSH access (configure host in **local** `secrets.env`, never commit):

```bash
npm run vault:vps -- status          # metadata only
npm run vault:vps -- list            # key names
npm run vault:vps -- show JWT_SECURITY_KEY   # masked
npm run vault:vps -- reveal JWT_SECURITY_KEY # full value + VPS audit log
npm run vault:vps -- audit           # required keys present?
```

Scripts: [`scripts/ops/vps-vault.sh`](../../scripts/ops/vps-vault.sh), [`scripts/ops/vps-vault-remote.sh`](../../scripts/ops/vps-vault-remote.sh).

### Store / update

1. SSH as root (or use a maintainers-only runbook).
2. Edit `/root/uniz-secrets.env` (keep `chmod 600`).
3. Re-run deploy (or the vault→K8s sync step in `scripts/deploy/deploy.sh`) so pods pick up `uniz-secrets`.
4. Rotate any key that was ever pasted into chat, a PR, or a student machine.

### GitHub Actions

CI/deploy uses **repository/organization Secrets** (not the VPS file) for:

- GHCR push credentials
- Cloudflare Pages / API tokens
- Deploy SSH key
- Build-time `VITE_*` that must be public site keys only (Turnstile site key is OK; never put private keys in `VITE_*`)

## Separation: ConfigMap vs Secret

| Kind | Examples |
|------|----------|
| ConfigMap `uniz-config` | `GATEWAY_URL`, `ENABLE_OUTPASS_OUTING`, service DNS URLs, `CLIENT_URL` |
| Secret `uniz-secrets` | `JWT_SECURITY_KEY`, `*_DATABASE_URL`, `AWS_*`, `VAPID_PRIVATE_KEY`, SMTP passwords |

If a value can mint sessions, read student data, or send email as the university — it is a **Secret**.

## Contributor checklist

- [ ] No secrets in commits (`git status` / PR diff)
- [ ] Local `secrets.env` from example only
- [ ] Screenshots/logs redacted before posting in issues
- [ ] Never commit `.env`, vault backups, or kubeconfigs with tokens

## Maintainer: harden VPS vault once

```bash
ssh root@YOUR_VPS 'chmod 600 /root/uniz-secrets.env && chown root:root /root/uniz-secrets.env && ls -la /root/uniz-secrets.env'
# Optional audit log for reveal:
ssh root@YOUR_VPS 'touch /var/log/uniz-vault-access.log && chmod 600 /var/log/uniz-vault-access.log'
```

Deploy always re-renders K8s `Secret/uniz-secrets` from that file via `secrets.yaml.template` + `envsubst` — the git repo never contains the filled Secret.
