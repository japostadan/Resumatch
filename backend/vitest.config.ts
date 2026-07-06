import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Discover tests only in source. Vitest does not honor .gitignore for test
    // discovery, so without this it also picks up the compiled copies under
    // dist/ — running the whole suite twice and letting a stale dist mask a
    // real failure in src.
    include: ["src/**/*.test.ts"],
  },
});
