# UniZ Files Service (Folded / Legacy Compatibility)

> **Status:** Profile image processing (`sharp`) and campus banner uploads live in [`uniz-user`](../uniz-user/README.md). This lightweight Express 4 service (`PORT=3005`) remains in the workspace only for legacy file-route compatibility and `/health` checks.

## Architecture Overview

- **Runtime:** Node.js + TypeScript + Express 4 (`PORT=3005`)
- **Security & Middleware:** `helmet`, `cors`, `compression`, `attributionMiddleware` (`@uniz/shared`)
- **Endpoints:** `/health` and legacy file routes (`src/routes/file.routes.ts`)

## Local Development

```bash
npm install
npm run build
npm run dev   # http://localhost:3005
```

> Part of [`uniz-master`](../../README.md).
