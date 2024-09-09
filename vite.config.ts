import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/__tests__/**.test.ts"],
    coverage: {
      reporter: ["json-summary", "html"],
      include: ["src/**"],
      exclude: ["src/__tests__/**", "src/index.ts"],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90
      },
      ignoreEmptyLines: true,
      reportOnFailure: true
    }
  }
});
