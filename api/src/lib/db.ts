import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import * as schema from "../../database/schema/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const dbPath = resolve(__dirname, "../../../", config.databaseUrl);
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
