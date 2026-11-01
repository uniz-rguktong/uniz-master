import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/utils/password-flag.ts", "src/utils/login-ratelimit.ts", "src/middlewares/auth.middleware.ts"],
      reporter: ["text", "json-summary", "lcov"],
    },
  },
});
