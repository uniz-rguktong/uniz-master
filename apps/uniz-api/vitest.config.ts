import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "uniz-auth-service/createApp": path.resolve(__dirname, "tests/stubs/authApp.ts"),
      "uniz-user-service/createApp": path.resolve(__dirname, "tests/stubs/userApp.ts"),
      "uniz-academics-service/createApp": path.resolve(
        __dirname,
        "tests/stubs/academicsApp.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
    },
  },
});
