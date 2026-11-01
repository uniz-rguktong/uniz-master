// Fake values so auth modules never fall through to a developer .env or a live service.
process.env.NODE_ENV = "test";
process.env.JWT_SECURITY_KEY = "unit-test-jwt-key";
process.env.INTERNAL_SECRET = "unit-test-internal";
process.env.AUTH_DATABASE_URL =
  "postgresql://user:pass@127.0.0.1:5432/uniz_auth?schema=auth";
delete process.env.DATABASE_URL;
delete process.env.REDIS_URL;
delete process.env.TURNSTILE_SECRET_KEY;
delete process.env.SLOW_QUERY_MS;
delete process.env.SKIP_PUSH;
delete process.env.USER_SERVICE_URL;
delete process.env.MAIL_SERVICE_URL;
delete process.env.GATEWAY_URL;
delete process.env.NOTIFICATION_SERVICE_URL;
delete process.env.PRISMA_CONNECTION_LIMIT;
delete process.env.PRISMA_POOL_TIMEOUT;
