# Rollback (single-VPS + Cloudflare Pages)

Prefer **redeploying a known-good SHA** over force-pushing `main`.

## Quick path (recommended)

1. Keep a backup branch of the tip you are leaving (already done for the Nov 2026 rollback as `backup/main-2026-11-15`).
2. Reset or merge `main` to the target commit through the normal PR/ruleset process when possible.
3. Force a full image rebuild + VPS deploy:

```bash
gh workflow run "VPS Automated Deployment" \
  --ref main \
  -f force_rebuild=true \
  -f commit_message="rollback redeploy"

gh workflow run "Deploy Frontends to Cloudflare Pages" \
  --ref main \
  -f target=all
```

4. Watch runs, then smoke:

```bash
bash scripts/ops/post-deploy-smoke.sh
```

## Scoped rebuild

```bash
gh workflow run "VPS Automated Deployment" \
  --ref main \
  -f services="gateway auth user" \
  -f commit_message="rebuild edge services"
```

## Emergency note

Force-updating `main` requires temporarily disabling the `main-protection` ruleset `non_fast_forward` rule. Prefer the workflow `force_rebuild` path when the commit is already on `main`.
