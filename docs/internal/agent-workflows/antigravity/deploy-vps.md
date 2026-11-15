---
description: Build, Deploy and Verify UniZ services on VPS (K3s)
---

// turbo-all

Prefer GitHub Actions (self-hosted VPS runner) over manual SSH deploys. See the cursor-agents copy of this workflow for the current numbers and commands:

`docs/internal/agent-workflows/cursor-agents/deploy-vps.md`

```bash
gh workflow run "VPS Automated Deployment" -f force_rebuild=false -f commit_message="manual deploy"
gh workflow run "Deploy Frontends to Cloudflare Pages" -f target=all
bash scripts/ops/post-deploy-smoke.sh
```

HPA caps on the single 4-vCPU node: gateway 1→3, auth 1→2, user/academics 1→3, notifications 1→2.
