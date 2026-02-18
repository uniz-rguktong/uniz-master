# UniZ User Service

**Repository**: `uniz-user-service`
**Role**: Profile Management.

## Responsibility

- **Profiles**: Stores Student, Admin, and Faculty profile data.
- **Role Management**: Enforces RBAC at the profile level.

## Architecture

Read-heavy service. Connects to `users` schema in Postgres.

## Running Locally

```bash
npm install
npm run dev
# Listens on PORT 3002
```

## Environment Variables

- `DATABASE_URL`: Postgres Connection String.
- `JWT_SECURITY_KEY`: For verifying tokens.
