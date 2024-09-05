import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**.test.ts"],
    coverage: {
      reporter: ["json-summary", "html"],
      include: ["src/**"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      },
      ignoreEmptyLines: true
    }
  }
});
