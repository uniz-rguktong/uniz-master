import { defineConfig, type Plugin } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

// Keep unit tests off real databases, Redis, and secret files.
for (const key of [
  "REDIS_URL",
  "DATABASE_URL",
  "ACADEMICS_DATABASE_URL",
  "DIRECT_URL",
  "TURNSTILE_SECRET_KEY",
]) {
  delete process.env[key];
}
process.env.NODE_ENV = "test";
process.env.DOCKER_ENV = "false";
process.env.JWT_SECURITY_KEY = "unit-test-jwt-key";
process.env.INTERNAL_SECRET = "unit-test-internal";
process.env.USER_SERVICE_URL = "http://user-service.test";
process.env.AUTH_SERVICE_URL = "http://auth-service.test";
process.env.GATEWAY_URL = "http://gateway.test";

function stubPath(name: string): string {
  return path.join(root, "tests", "stubs", name);
}

function stubInfra(): Plugin {
  return {
    name: "academics-test-stubs",
    enforce: "pre",
    resolveId(source) {
      const id = source.replace(/\\/g, "/");
      if (
        id === "./prisma.util" ||
        id.endsWith("/prisma.util") ||
        id.endsWith("/prisma.util.ts")
      ) {
        return stubPath("prisma.util.ts");
      }
      if (
        id === "./redis.util" ||
        id.endsWith("/redis.util") ||
        id.endsWith("/redis.util.ts")
      ) {
        return stubPath("redis.util.ts");
      }
      return null;
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      axios: stubPath("axios.ts"),
      bullmq: stubPath("bullmq.ts"),
      ioredis: stubPath("ioredis.ts"),
      dotenv: stubPath("dotenv.ts"),
    },
  },
  plugins: [stubInfra()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    clearMocks: true,
    restoreMocks: false,
    server: {
      deps: {
        inline: ["axios", "bullmq", "ioredis", "dotenv"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/generated/**"],
    },
  },
});
