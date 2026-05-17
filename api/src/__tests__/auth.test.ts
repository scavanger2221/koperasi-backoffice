import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import * as schema from "../../database/schema/index.js";
import { app } from "../app.js";

const DB_PATH = process.env.TEST_DATABASE_URL!;

beforeAll(async () => {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  const testDb = drizzle(sqlite, { schema });
  migrate(testDb, { migrationsFolder: "./database/migrations" });

  // Seed admin only if not exists
  const existing = testDb.select().from(schema.users).where(eq(schema.users.email, "admin@koperasi.id")).get();
  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 10);
    testDb.insert(schema.users).values({
      id: randomUUID(),
      email: "admin@koperasi.id",
      password: hashed,
      nama: "Admin Test",
      role: "admin",
    }).run();
  }

  sqlite.close();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 + token with valid credentials", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@koperasi.id", password: "admin123" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.user.email).toBe("admin@koperasi.id");
    expect(body.data.user.role).toBe("admin");
  });

  it("returns 401 with wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@koperasi.id", password: "wrongpass" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBeTruthy();
  });

  it("returns 400 with missing fields", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid email format", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "admin123" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/anggota (auth protected)", () => {
  it("returns 401 without token", async () => {
    const res = await app.request("/api/anggota");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await app.request("/api/anggota", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 with valid token", async () => {
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@koperasi.id", password: "admin123" }),
    });
    const { token } = (await loginRes.json()).data;

    const res = await app.request("/api/anggota", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
