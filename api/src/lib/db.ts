import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

// Allow test database override via env var
const dbPath = process.env.TEST_DATABASE_URL || "./database/koperasi.db";

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
