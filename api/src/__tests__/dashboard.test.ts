import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("Dashboard", () => {
  let token: string;
  let anggotaId: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();

    token = await getAdminToken(app);
    anggotaId = await createTestAnggota(app, token);
    await activateAnggota(app, token, anggotaId);

    // Seed some data so dashboard has something to show
    await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jenis: "pokok", jumlah: "500000", tanggal: "2025-01-15" }),
    });
    await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jenis: "wajib", jumlah: "100000", tanggal: "2025-01-15" }),
    });
  });

  // ── RINGKASAN ─────────────────────────────────────────────────────────────

  it("GET /api/dashboard/ringkasan — returns summary stats", async () => {
    const res = await app.request("/api/dashboard/ringkasan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("totalAnggota");
    expect(body.data).toHaveProperty("totalSimpanan");
    expect(body.data).toHaveProperty("totalPinjamanAktif");
    expect(body.data).toHaveProperty("totalPinjaman");
    expect(body.data).toHaveProperty("totalTunggakan");
    expect(body.data).toHaveProperty("jumlahAngsuranTunggakan");

    expect(body.data.totalAnggota).toBeGreaterThanOrEqual(1);
    expect(body.data.totalSimpanan).toBeGreaterThanOrEqual(600000);
  });

  // ── SIMPANAN PER BULAN ────────────────────────────────────────────────────

  it("GET /api/dashboard/simpanan-per-bulan — returns monthly savings chart data", async () => {
    const res = await app.request("/api/dashboard/simpanan-per-bulan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty("label");
      expect(body.data[0]).toHaveProperty("month");
      expect(body.data[0]).toHaveProperty("year");
      expect(body.data[0]).toHaveProperty("total");
    }
  });

  // ── PINJAMAN STATUS ──────────────────────────────────────────────────────

  it("GET /api/dashboard/pinjaman-status — returns loan status counts", async () => {
    const res = await app.request("/api/dashboard/pinjaman-status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("diajukan");
    expect(body.data).toHaveProperty("disetujui");
    expect(body.data).toHaveProperty("aktif");
    expect(body.data).toHaveProperty("lunas");
    expect(body.data).toHaveProperty("ditolak");
    expect(body.data).toHaveProperty("macet");
    expect(body.data).toHaveProperty("total");
  });

  // ── AKTIVITAS ────────────────────────────────────────────────────────────

  it("GET /api/dashboard/aktivitas — returns recent activity", async () => {
    const res = await app.request("/api/dashboard/aktivitas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("anggotaBaru");
    expect(body.data).toHaveProperty("simpananBaru");
    expect(body.data).toHaveProperty("pinjamanBaru");
    expect(Array.isArray(body.data.anggotaBaru)).toBe(true);
    expect(Array.isArray(body.data.simpananBaru)).toBe(true);
    expect(Array.isArray(body.data.pinjamanBaru)).toBe(true);
    // Recent simpanan should include anggota info
    if (body.data.simpananBaru.length > 0) {
      expect(body.data.simpananBaru[0].anggota).toBeDefined();
    }
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────

  it("GET /api/dashboard/ringkasan — returns 401 without token", async () => {
    const res = await app.request("/api/dashboard/ringkasan");
    expect(res.status).toBe(401);
  });

  it("GET /api/dashboard/ringkasan — returns 403 for anggota role", async () => {
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Dashboard User",
        email: "dashboard-user@test.com",
        password: "password123",
        noTelepon: "081234567892",
        nik: "6666666666666666",
        alamat: "Jl. Dashboard No. 1",
      }),
    });
    const regularToken = (await regRes.json()).data.token;

    const res = await app.request("/api/dashboard/ringkasan", {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    // anggota role is not in the allowed roles list
    expect(res.status).toBe(403);
  });
});
