# UniZ Cron Service

**Repository**: `uniz-cron-service`
**Role**: Scheduled Maintenance.

## Responsibility

- **Cleanup**: Removes stale OTPs.
- **Expiry**: Auto-expires outpasses that passed their `toDay`.

## Architecture

Runs strictly as a background scheduler. Idempotent logic.

## Running Locally

```bash
npm install
npm run dev
```

## Environment Variables

- `DATABASE_URL`: Postgres Connection.
