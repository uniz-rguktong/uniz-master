# UniZ Notification Service (`uniz-notifications`)

Unified communications service handling Web Push notifications, user inbox alerts, and transactional AWS SES emails (`/send`) across UniZ.

## Architecture Overview

- **Runtime:** Node.js + TypeScript + Express (`PORT=3007`)
- **Web Push:** `web-push` (VAPID key advertisement on `GET /`, subscription management via `push.routes.ts`)
- **Inbox & Worker:** Redis (`ioredis`) background notification worker (`src/worker/notification.worker.ts`) backed by Prisma (`prisma@^6.4.1`, PostgreSQL)
- **Email Consolidation:** Serves `POST /send` (gateway rewrites `/api/v1/mail/*` → `uniz-notifications`) using `@aws-sdk/client-sesv2` / `@aws-sdk/client-ses` and `nodemailer` with `@uniz/shared` HTML templates

## Endpoints

- `GET /` — service status & `vapidPublicKey`
- `GET /health` — `{ status: "ok", capabilities: ["push", "inbox", "mail"] }`
- `/subscribe` & push routes
- Inbox routes
- `/send` — transactional email dispatch

## Local Development

```bash
cp .env.example .env
npm install
npm run dev
```

> Part of [`uniz-master`](../../README.md).
