import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10_000,
    pool: "forks",            // each file gets its own process
    fileParallelism: false,   // but still sequential to avoid resource contention
    setupFiles: ["./src/test-setup.ts"],
  },
});
