# UniZ Outpass Service

**Repository**: `uniz-outpass-service`
**Role**: Core Domain Logic (Requests & Approvals).

## Responsibility

- **Workflow**: Creates Outpass and Outing requests.
- **Approvals**: Handles Role-based approval flows (Warden, Caretaker).
- **History**: Read-optimized history fetching.

## Architecture

Event-driven. Emits events to `uniz-notification-service` via Redis when status changes.

## Running Locally

```bash
npm install
npm run dev
# Listens on PORT 3003
```

## Environment Variables

- `DATABASE_URL`: Postgres Connection String.
- `REDIS_URL`: Connection for queues.
