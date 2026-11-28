# UniZ Outpass & Maintenance Service (`uniz-outpass`)

Orchestrates campus outpass/outing workflows and hosts scheduled maintenance endpoints (`/api/cron` migrated from deprecated `uniz-cron`).

> **Production Status:** Outpass and outing endpoints are currently **parked** at the gateway (`503 OUTPASS_OUTING_DISABLED` unless `ENABLE_OUTPASS_OUTING=true`). Grievance workflows moved to [`uniz-user`](../uniz-user/README.md).

## Architecture Overview

- **Runtime:** Node.js + TypeScript + Express 4 (`PORT=3003`)
- **ORM / DB / Queue:** Prisma (`prisma@^6.4.1`) + PostgreSQL (`outpass` schema) + Redis (`ioredis`)
- **Routes:**
  - `request.routes.ts` — student outpass/outing request workflows
  - `maintenance.routes.ts` — scheduled cleanup & maintenance (`/api/cron`)
  - `GET /health` — `{ status: "ok", service: "uniz-outpass-service" }`

## Local Development

```bash
cp .env.example .env
npm install
npx prisma db push
npm run dev   # http://localhost:3003
```

> Part of [`uniz-master`](../../README.md).
