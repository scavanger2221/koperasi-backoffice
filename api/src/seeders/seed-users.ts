import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedUsers(db: BetterSQLite3Database<typeof schema>) {
  const existing = db.select().from(schema.users).where(eq(schema.users.email, "admin@koperasi.id")).get();
  if (existing) {
    console.log("admin user already exists, skipping");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  db.insert(schema.users).values({
    id: crypto.randomUUID(),
    email: "admin@koperasi.id",
    password: hashedPassword,
    nama: "Admin Koperasi",
    role: "admin",
  }).run();

  console.log("admin@koperasi.id / admin123");
}
