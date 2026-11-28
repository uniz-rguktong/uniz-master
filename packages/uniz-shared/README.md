# `@uniz/shared`

Shared types, role rules, security primitives, email templates, and constants consumed across UniZ TypeScript microservices (`apps/*`).

## Key Exports (`src/index.ts`)

- **Roles & RBAC (`roles.enum.ts`, `admin-role.ts`):** `UserRole`, `ADMIN_ROLES`, `resolveEffectiveRole`, HOD branch helpers, canonical webadmin guards, and institutional email normalization.
- **Auth & Sessions (`jwt.schema.ts`, `session-gate.ts`, `internal-secret.ts`):** `JwtPayloadSchema` (Zod), `PASSWORD_CHANGE_REQUIRED` / `AUTH_TOKEN_REVOKED`, `rejectStaleSession`, and internal secret validation.
- **Security & Rate Limiting (`router-limiter.ts`, `log-sanitize.ts`):** `routerLimiterOptions`, `clientKey`, `sanitizeLog`.
- **Email Layouts & Builders (`email-layout.ts`, `email-messages.ts`, `grievance-email.ts`):** Shared HTML transactional email layouts (`renderUnizEmail`, OTP, login alert, results, attendance, grievance).
- **Academics & Attribution (`branches.ts`, `error-codes.ts`, `attribution.ts`):** Engineering branch normalization, shared `ErrorCode`, and `API_ATTRIBUTION`.

## Build & Test

```bash
npm run build
npm test
```

Formatted and checked in CI via root `npm run format:check`.

> Part of [`uniz-master`](../../README.md).
