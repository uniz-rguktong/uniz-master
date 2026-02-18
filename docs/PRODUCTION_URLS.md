# UniZ Production URLs (Updated 2026-02-07)

## API Gateway

- **Production Gateway**: `https://uniz-gateway.vercel.app/api/v1`

## Microservices

| Service       | Production URL                                       | GitHub Repo                      |
| ------------- | ---------------------------------------------------- | -------------------------------- |
| Auth          | `https://uniz-auth.vercel.app`                       | uniz-rguktong/uniz-auth          |
| User          | `https://uniz-user-service-five.vercel.app`          | uniz-rguktong/uniz-user          |
| Outpass       | `https://uniz-outpass-service-snowy.vercel.app`      | uniz-rguktong/uniz-outpass       |
| Academics     | `https://uniz-academics-service-beryl.vercel.app`    | uniz-rguktong/uniz-academics     |
| Mail          | `https://uniz-mail-service-phi.vercel.app`           | uniz-rguktong/uniz-mail          |
| Notifications | `https://uniz-notification-service-sandy.vercel.app` | uniz-rguktong/uniz-notifications |
| Files         | `https://uniz-files-service-blush.vercel.app`        | uniz-rguktong/uniz-files         |
| Cron          | `https://uniz-cron-service-theta.vercel.app`         | uniz-rguktong/uniz-cron          |

## Health Check Endpoints

Each service has a `/health` endpoint for monitoring.

## Environment Variables

The following environment variables should be set in each service:

- `GATEWAY_URL` - Points to the production gateway
- `INTERNAL_SECRET` - Shared secret for internal service communication
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Upstash Redis URL
- `JWT_SECURITY_KEY` - JWT signing key

## GitHub Organization

All repositories are under the `uniz-rguktong` organization.
