# UniZ Auth Service

**Repository**: `uniz-auth-service`
**Role**: Identity Provider for UniZ.

## Responsibility

- **Authentication**: Login, Signup (disabled for now), Password Management.
- **Tokens**: Issues separate JWTs for stateless auth.
- **OTP**: Handles OTP generation and validation logic.

## Architecture

Isolated service with its own dedicated Database Schema (`auth` schema in Postgres).

## Running Locally

```bash
npm install
npm run dev
# Listens on PORT 3001
```

## Environment Variables

- `DATABASE_URL`: Postgres Connection String.
- `JWT_SECURITY_KEY`: Private key for signing tokens.
