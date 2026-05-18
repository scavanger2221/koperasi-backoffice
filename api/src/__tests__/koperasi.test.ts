import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, getAdminToken } from "./setup.js";

describe("Koperasi (Pengaturan)", () => {
  let token: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    await seedAdmin(testDb);
    sqlite.close();
    token = await getAdminToken(app);
  });

  // ── GET (empty) ───────────────────────────────────────────────────────────

  it("GET /api/koperasi — returns null when no data exists", async () => {
    const res = await app.request("/api/koperasi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  // ── CREATE ────────────────────────────────────────────────────────────────

  it("POST /api/koperasi — creates koperasi data", async () => {
    const res = await app.request("/api/koperasi", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nama: "Koperasi Simpan Pinjam Sejahtera",
        alamat: "Jl. Merdeka No. 123",
        jenis: "ksp",
        kota: "Jakarta",
        provinsi: "DKI Jakarta",
        noTelepon: "021-12345678",
        email: "koperasi@example.com",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.nama).toBe("Koperasi Simpan Pinjam Sejahtera");
    expect(body.data.jenis).toBe("ksp");
  });

  it("POST /api/koperasi — rejects duplicate creation", async () => {
    const res = await app.request("/api/koperasi", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nama: "Duplicate Koperasi" }),
    });
    expect(res.status).toBe(400);
  });

  // ── GET (after create) ────────────────────────────────────────────────────

  it("GET /api/koperasi — returns koperasi data", async () => {
    const res = await app.request("/api/koperasi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.nama).toBe("Koperasi Simpan Pinjam Sejahtera");
    expect(body.data.alamat).toBe("Jl. Merdeka No. 123");
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  it("PATCH /api/koperasi — updates koperasi data", async () => {
    const res = await app.request("/api/koperasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nama: "Koperasi Sejahtera Updated",
        badanHukum: "AHU-12345.AH.01.27",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.nama).toBe("Koperasi Sejahtera Updated");
    expect(body.data.badanHukum).toBe("AHU-12345.AH.01.27");
    // Previous data should be preserved
    expect(body.data.alamat).toBe("Jl. Merdeka No. 123");
  });

  it("PATCH /api/koperasi — rejects empty update", async () => {
    const res = await app.request("/api/koperasi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  // ── AUTH ──────────────────────────────────────────────────────────────────

  it("GET /api/koperasi — returns 401 without token", async () => {
    const res = await app.request("/api/koperasi");
    expect(res.status).toBe(401);
  });

  it("POST /api/koperasi — returns 403 for bendahara role", async () => {
    // Create bendahara user
    await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "bendahara-koperasi@test.com",
        password: "password123",
        nama: "Bendahara Test",
        role: "bendahara",
      }),
    });

    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bendahara-koperasi@test.com", password: "password123" }),
    });
    const bToken = (await loginRes.json()).data.token;

    const res = await app.request("/api/koperasi", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bToken}` },
      body: JSON.stringify({ nama: "Test" }),
    });
    expect(res.status).toBe(403);
  });
});
