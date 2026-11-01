import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const prismaStub = path.resolve(root, "test/stubs/prisma-client.ts");

export default defineConfig({
  plugins: [
    {
      name: "stub-generated-prisma",
      enforce: "pre",
      resolveId(source) {
        const normalized = source.replaceAll("\\", "/");
        if (
          normalized.endsWith("/generated/prisma") ||
          normalized.endsWith("generated/prisma")
        ) {
          return prismaStub;
        }
        return null;
      },
    },
  ],
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts", "test/setup-env.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "json-summary", "lcov"],
    },
  },
});
