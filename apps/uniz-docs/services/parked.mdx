---
title: "Parked & folded services"
description: "What was retired from always-on VPS — nginx gateway, portal/landing Deployments, outpass, mail, files, cron — and where the logic went."
---

These Deployments stay in git for rollback but run at **replicas: 0** in production.

```mermaid
flowchart TB
  subgraph Parked
    Nginx[uniz-gateway nginx]
    PortalDep[uniz-portal Deploy]
    LandingDep[uniz-landing Deploy]
    Outpass[uniz-outpass-service]
    Mail[uniz-mail-service]
    Files[uniz-files-service]
    CronDep[uniz-cron Deploy]
  end
  subgraph Live
    Traefik --> GWAPI[gateway-api]
    Pages[Cloudflare Pages]
    User[user-service]
    Notif[notifications]
    CronJob[K8s CronJobs]
  end
  Nginx -.->|replaced by| Traefik
  PortalDep -.->|replaced by| Pages
  LandingDep -.->|replaced by| Pages
  Mail -.->|folded into| Notif
  Files -.->|folded into| User
  Outpass -.->|grievance folded into| User
  CronDep -.->|replaced by| CronJob
```

| Unit | Status | Logic now |
|------|--------|-----------|
| nginx `uniz-gateway` | Parked | Traefik → gateway-api |
| portal / landing Deploy | Parked | Cloudflare Pages |
| outpass | Parked + flag off | Revive via [Revive outpass](/howto/revive-outpass); grievance on user |
| mail | Parked | `apps/uniz-notifications/src/mail` |
| files | Parked | `apps/uniz-user` `files.routes` |
| cron Deployment | Parked | `cron-job.yaml` / storage cleanup CronJob |

CI enforces zeros in `scripts/ci/ci-remote-deploy.sh`.
