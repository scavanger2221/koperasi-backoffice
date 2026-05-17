/**
 * Vitest setup — runs before each test file.
 * Creates an isolated temp database path so test files don't interfere.
 */

import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DIR = mkdtempSync(join(tmpdir(), "koperasi-test-"));

process.env.TEST_DATABASE_URL = join(TEST_DIR, "koperasi-test.db");
process.env.KOPERASI_TEST_DIR = TEST_DIR;

// Cleanup on worker exit
process.on("exit", () => {
  try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch {}
});
