# UniZ DB Admin Service (`uniz-dbadmin`)

Webadmin-only PostgreSQL catalog browser, audited data editor, and access proxy for UniZ.

## Architecture Overview

- **Runtime:** Node.js + TypeScript + Express 4 (`PORT=3010`)
- **Auth & RBAC:** Enforces `requireWebadmin` JWT verification (`jsonwebtoken` / `jose`)
- **Database & Audit:** Direct `pg` target connections (`loadTargets`, `withClient`), parameterized catalog/table queries, rate limiting (`reads` 60/min, `writes` 30/min, plus `@uniz/shared` `routerLimiterOptions`), and persistent request/change audit logging (`audit/store`)
- **Hardening:** `helmet`, sanitized Postgres error mapping (`DbAdminError`, `sanitizePgMessage`)

## Scripts

```bash
npm install
npm test                # tsc && node --test dist/audit/logic.test.js dist/catalog.tables.test.js
npm run build
npm start               # node dist/index.js
npm run start:access-proxy
```

> Part of [`uniz-master`](../../README.md).
