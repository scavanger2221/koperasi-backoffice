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

async function getToken(): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@koperasi.id", password: "admin123" }),
  });
  return (await res.json()).data.token;
}

describe("Anggota CRUD", () => {
  let token: string;
  let anggotaId: string;

  beforeAll(async () => {
    token = await getToken();
  });

  it("POST /api/anggota — creates a member with auto-generated no_anggota", async () => {
    const res = await app.request("/api/anggota", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nik: "1234567890123456",
        nama: "Test Member",
        tempatLahir: "Jakarta",
        tanggalLahir: "1990-01-01",
        alamat: "Jl. Test No. 1",
        pekerjaan: "Tester",
        noTelepon: "081234567899",
        email: "test@example.com",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.nama).toBe("Test Member");
    expect(body.data.noAnggota).toMatch(/^AG\d{5}$/);
    anggotaId = body.data.id;
  });

  it("GET /api/anggota — lists members (paginated)", async () => {
    const res = await app.request("/api/anggota", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("page");
    expect(body.meta).toHaveProperty("limit");
  });

  it("GET /api/anggota/:id — gets detail", async () => {
    const res = await app.request(`/api/anggota/${anggotaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.nama).toBe("Test Member");
    expect(body.data.id).toBe(anggotaId);
  });

  it("PATCH /api/anggota/:id — updates a member", async () => {
    const res = await app.request(`/api/anggota/${anggotaId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nama: "Test Member Updated", pekerjaan: "Senior Tester" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.nama).toBe("Test Member Updated");
  });

  it("PATCH /api/anggota/:id/activate — activates a member", async () => {
    const res = await app.request(`/api/anggota/${anggotaId}/activate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("aktif");
  });

  it("DELETE /api/anggota/:id — deletes a member", async () => {
    const res = await app.request(`/api/anggota/${anggotaId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("returns 404 for non-existent member", async () => {
    const res = await app.request("/api/anggota/non-existent-id", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  it("rejects missing required fields", async () => {
    const res = await app.request("/api/anggota", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nama: "Incomplete" }),
    });
    expect(res.status).toBe(400);
  });
});
