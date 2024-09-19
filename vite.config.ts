import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: ["repos"]
    }
  },
  test: {
    include: ["src/__tests__/**.test.ts"],
    coverage: {
      reporter: ["json-summary", "html"],
      include: ["src/**"],
      exclude: ["src/__tests__/**", "src/index.ts"],
      thresholds: {
        statements: 90,
        functions: 100,
        lines: 90
      },
      ignoreEmptyLines: true,
      reportOnFailure: true
    },
    hookTimeout: 30000
  }
});
