---
title: "Find anything in the codebase"
description: "Operator search guide — map symptoms and features to files, services, and docs pages."
---

## By symptom

| Symptom | First files to open |
|---------|---------------------|
| Wrong API routing / 502 | `apps/uniz-gateway/src/index.ts` |
| Login broken | `apps/uniz-auth/src/` |
| First-login code | `apps/uniz-auth/src/utils/first-login-otp.ts`, `apps/uniz-portal/src/pages/auth/SetPassword.tsx` |
| Roles screen | `apps/uniz-portal/src/pages/admin/RoleManagement.tsx` |
| Database browser | `apps/uniz-portal/src/pages/admin/Webadmin/database/`, `apps/uniz-dbadmin/` |
| Website editor | `apps/uniz-portal/src/pages/admin/Webadmin/WebsiteEditorSection.tsx` |
| Profile / notices / grievance | `apps/uniz-user/src/routes/` |
| Grades / registration | `apps/uniz-academics/src/` |
| Push / email | `apps/uniz-notifications/src/` |
| Portal blank / wrong API host | `apps/uniz-portal/src/api/endpoints.ts`, Pages build secrets |
| Landing CMS | `apps/uniz-landing-backend/` |
| Ingress / TLS hosts | `infra/.../shared/ingress.yaml` |
| Replicas / HPA | `infra/.../core/*-service.yaml` |
| FE DNS | `scripts/deploy/cutover-frontends-to-pages-dns.sh` |
| VPS deploy | `.github/workflows/deploy.yml`, `scripts/ci/ci-remote-deploy.sh` |

## By keyword (grep)

```bash
rg "ENABLE_OUTPASS_OUTING" -g '!node_modules'
rg "serviceMap" apps/uniz-gateway
rg "mustChangePassword" apps/uniz-auth packages/uniz-shared
rg "dbadmin" apps/uniz-gateway apps/uniz-dbadmin
rg "Grievance" apps/uniz-user
rg "VITE_API_URL" apps/uniz-portal scripts .github
```

## Docs navigation

Start at [Search index](/search-index). New operator pages: [Webadmin workspace](/admin/webadmin), [Roles screen](/admin/roles-directory), [Database](/admin/database), [Website editor](/admin/website-editor), [Responsive audit](/howto/responsive-audit). Keywords: first-login OTP, `mustChangePassword`, `tokenVersion`, `dbadmin`, light-only, login-revamp.
