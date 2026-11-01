process.env.NODE_ENV = "test";
process.env.INTERNAL_SECRET = "unit-test-internal";
delete process.env.CRICTL_TIMEOUT;
