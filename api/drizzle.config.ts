import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export default defineConfig({
  schema: "./database/schema/*.ts",
  out: "./database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: resolve(process.cwd(), "./database/koperasi.db"),
  },
});
