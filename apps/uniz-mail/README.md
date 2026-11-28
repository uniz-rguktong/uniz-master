# UniZ Mail Service (Folded into `uniz-notifications`)

> **Status:** Production `/api/v1/mail/*` traffic is served by [`uniz-notifications`](../uniz-notifications/README.md) (`POST /send` via AWS SES + Nodemailer). This package (`PORT=3006`) is retained for standalone fallback and historical separation.

## Technology Stack

- **Runtime:** Node.js + TypeScript + Express 4 (`PORT=3006`)
- **Mail Delivery:** AWS SES (`@aws-sdk/client-ses`, `@aws-sdk/client-sesv2`) + `nodemailer`
- **Shared Primitives:** `@uniz/shared` email layouts/builders (`ioredis` queue integration)

## Local Development

```bash
npm install
npm run build
npm run dev   # http://localhost:3006
```

> Part of [`uniz-master`](../../README.md).
