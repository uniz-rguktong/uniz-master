process.env.NODE_ENV = "test";
process.env.JWT_SECURITY_KEY = "test-jwt-secret";
process.env.INTERNAL_SECRET = "test-internal";
delete process.env.ENFORCE_PASSWORD_CHANGE;
delete process.env.RATE_LIMIT_MODE;
