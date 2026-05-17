import { describe, it, expect, beforeAll } from "vitest";
import * as schema from "../../database/schema/index.js";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("Simpanan", () => {
  let token: string;
  let anggotaId: string;
  let sqlite: ReturnType<typeof initTestDb>["sqlite"];

  beforeAll(async () => {
    const testDb = initTestDb();
    sqlite = testDb.sqlite;
    seedAkun(testDb.testDb);
    await seedAdmin(testDb.testDb);
    sqlite.close();

    token = await getAdminToken(app);
    anggotaId = await createTestAnggota(app, token);
    await activateAnggota(app, token, anggotaId);
  });

  // ── CREATE ─────────────────────────────────────────────────────────────────

  it("POST /api/simpanan — creates pokok savings", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "pokok",
        jumlah: "500000",
        tanggal: "2025-01-15",
        metodeBayar: "tunai",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
  });

  it("POST /api/simpanan — creates wajib savings", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "wajib",
        jumlah: "100000",
        tanggal: "2025-01-15",
        metodeBayar: "transfer",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("POST /api/simpanan — creates sukarela savings", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "sukarela",
        jumlah: "250000",
        tanggal: "2025-02-01",
        metodeBayar: "qris",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("POST /api/simpanan — returns 404 for non-existent member", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId: "00000000-0000-0000-0000-000000000000",
        jenis: "sukarela",
        jumlah: "100000",
        tanggal: "2025-01-15",
      }),
    });
    expect(res.status).toBe(404);
  });

  it("POST /api/simpanan — returns 400 for deactivated member", async () => {
    const deactId = await createTestAnggota(app, token, {
      nik: "9999999999999991",
      nama: "Deactivated Member",
    });
    await app.request(`/api/anggota/${deactId}/deactivate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId: deactId,
        jenis: "wajib",
        jumlah: "50000",
        tanggal: "2025-01-15",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/simpanan — rejects invalid jumlah", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "wajib",
        jumlah: "abc",
        tanggal: "2025-01-15",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/simpanan — rejects invalid tanggal format", async () => {
    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "wajib",
        jumlah: "50000",
        tanggal: "invalid-date",
      }),
    });
    expect(res.status).toBe(400);
  });

  // ── LIST ───────────────────────────────────────────────────────────────────

  it("GET /api/simpanan — lists all savings (paginated)", async () => {
    const res = await app.request("/api/simpanan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(body.meta.total).toBeGreaterThanOrEqual(3);
    // Check anggota info is attached
    expect(body.data[0].anggota).toBeTruthy();
    expect(body.data[0].anggota.nama).toBe("Test Member");
  });

  it("GET /api/simpanan — filters by anggotaId", async () => {
    const res = await app.request(`/api/simpanan?anggotaId=${anggotaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((s: any) => s.anggotaId === anggotaId)).toBe(true);
  });

  it("GET /api/simpanan — filters by jenis", async () => {
    const res = await app.request("/api/simpanan?jenis=pokok", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((s: any) => s.jenis === "pokok")).toBe(true);
  });

  it("GET /api/simpanan — paginates correctly", async () => {
    const res = await app.request("/api/simpanan?page=1&limit=2", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
  });

  // ── SALDO ──────────────────────────────────────────────────────────────────

  it("GET /api/simpanan/saldo/:anggotaId — returns aggregated saldo", async () => {
    const res = await app.request(`/api/simpanan/saldo/${anggotaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.pokok).toBe(500000);
    expect(body.data.wajib).toBe(100000);
    expect(body.data.sukarela).toBe(250000);
    expect(body.data.deposito).toBe(0);
    expect(body.data.total).toBe(850000);
  });

  it("GET /api/simpanan/saldo/:anggotaId — returns 200 even if member has no savings", async () => {
    const newMemberId = await createTestAnggota(app, token, {
      nik: "9999999999999992",
      nama: "No Savings Member",
    });
    await activateAnggota(app, token, newMemberId);
    const res = await app.request(`/api/simpanan/saldo/${newMemberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.total).toBe(0);
  });

  // ── AUTH — RBAC ────────────────────────────────────────────────────────────

  it("GET /api/simpanan — returns 401 without token", async () => {
    const res = await app.request("/api/simpanan");
    expect(res.status).toBe(401);
  });

  it("POST /api/simpanan — returns 403 for anggota role", async () => {
    // Register as regular member
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Regular User",
        email: "regular@test.com",
        password: "password123",
        noTelepon: "081234567890",
        nik: "8888888888888888",
        alamat: "Jl. Test No. 99",
      }),
    });
    const regularToken = (await regRes.json()).data.token;
    expect(regularToken).toBeTruthy();

    const res = await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${regularToken}` },
      body: JSON.stringify({
        anggotaId,
        jenis: "wajib",
        jumlah: "50000",
        tanggal: "2025-01-15",
      }),
    });
    expect(res.status).toBe(403);
  });

  // ── JURNAL ─────────────────────────────────────────────────────────────────

  it("creates jurnal entry automatically on simpanan creation", async () => {
    const res = await app.request("/api/jurnal?limit=5", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should have jurnal entries from the 3 simpanan created
    const simpananJurnals = body.data.filter((j: any) => j.refTipe === "simpanan");
    expect(simpananJurnals.length).toBeGreaterThanOrEqual(3);
  });
});
