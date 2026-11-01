import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/utils/**/*.ts",
        "src/middlewares/**/*.ts",
        "src/shared/user-ref.schema.ts",
        "src/controllers/grievance.controller.ts",
        "src/controllers/cms.controller.ts",
        "src/controllers/queue.controller.ts",
        "src/controllers/bulk.controller.ts",
        "src/controllers/profile.controller.ts",
        "src/services/bulk-worker.service.ts",
        "src/createApp.ts",
      ],
    },
  },
});
