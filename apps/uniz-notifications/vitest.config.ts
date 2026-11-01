import path from "node:path";
import { defineConfig } from "vitest/config";

const prismaStub = path.resolve(__dirname, "test/stubs/generated-prisma.ts");

export default defineConfig({
  plugins: [
    {
      name: "stub-generated-prisma",
      resolveId(id) {
        if (id === "../generated/prisma" || id.endsWith("/generated/prisma")) {
          return prismaStub;
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      "@uniz/shared": path.resolve(
        __dirname,
        "../../packages/uniz-shared/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**"],
    },
  },
});
