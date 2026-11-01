import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      TZ: "UTC",
    },
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage",
      include: [
        "src/controllers/**/*.ts",
        "src/middlewares/**/*.ts",
        "src/jobs/**/*.ts",
        "src/routes/**/*.ts",
        "src/shared/**/*.ts",
      ],
    },
  },
});
