# UniZ Notification Service

**Repository**: `uniz-notification-service`
**Role**: Async Communications.

## Responsibility

- **Emails**: Sends transactional emails (OTP, Approvals).
- **Decoupling**: Listens to Redis Queue. Never blocks the HTTP request path.

## Architecture

Worker process. Does NOT expose an HTTP API.

## Running Locally

```bash
npm install
npm run dev
# Runs as a generic worker
```

## Environment Variables

- `REDIS_URL`: Queue connection.
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Email provider config.
