/**
 * Role-Based Access Control (RBAC) tests.
 *
 * Verifies that each endpoint correctly enforces its role requirements
 * by testing one allowed role and one denied role per endpoint.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken } from "./setup.js";

describe("RBAC — Access Control", () => {
  let adminToken: string;
  let bendaharaToken: string;
  let pengurusToken: string;
  let pengawasToken: string;
  let anggotaToken: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();

    adminToken = await getAdminToken(app);

    // Create users for other roles
    for (const u of [
      { email: "rbac-pengurus@test.com", password: "password123", nama: "RBAC Pengurus", role: "pengurus" },
      { email: "rbac-bendahara@test.com", password: "password123", nama: "RBAC Bendahara", role: "bendahara" },
      { email: "rbac-pengawas@test.com", password: "password123", nama: "RBAC Pengawas", role: "pengawas" },
    ]) {
      await req("POST", "/api/users", adminToken, u);
    }

    // Register as anggota (can't create via /api/users since "anggota" not in userRoles)
    const regRes = await req("POST", "/api/auth/register", null, {
      nama: "RBAC Anggota",
      email: "rbac-anggota@test.com",
      password: "password123",
      noTelepon: "081234567899",
      nik: "1111111111111111",
      alamat: "Jl. RBAC Anggota",
    });
    anggotaToken = (await regRes.json()).data.token;

    // Login other roles
    const login = async (email: string) => {
      const r = await req("POST", "/api/auth/login", null, { email, password: "password123" });
      return (await r.json()).data.token;
    };
    pengurusToken = await login("rbac-pengurus@test.com");
    bendaharaToken = await login("rbac-bendahara@test.com");
    pengawasToken = await login("rbac-pengawas@test.com");
  });

  /** Helper: test a single request and assert status. */
  async function req(method: string, path: string, token: string | null, body?: any) {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";
    return app.request(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  }

  // ── 401: no token → all protected endpoints ───────────────────────────────

  describe("No token → 401", () => {
    const protectedEndpoints = [
      ["GET", "/api/anggota"],
      ["POST", "/api/anggota"],
      ["GET", "/api/simpanan"],
      ["GET", "/api/pinjaman"],
      ["GET", "/api/tagihan"],
      ["GET", "/api/jurnal"],
      ["GET", "/api/shu"],
      ["GET", "/api/rat"],
      ["GET", "/api/users"],
      ["GET", "/api/audit"],
      ["GET", "/api/auth/me"],
      ["GET", "/api/dashboard/ringkasan"],
    ] as const;

    for (const [method, path] of protectedEndpoints) {
      it(`${method} ${path}`, async () => {
        expect((await req(method, path, null)).status).toBe(401);
      });
    }

    it("POST /api/auth/login (no auth needed)", async () => {
      const r = await req("POST", "/api/auth/login", null, { email: "admin@koperasi.id", password: "admin123" });
      expect(r.status).toBe(200);
    });
  });

  // ── ANGGOTA endpoints ────────────────────────────────────────────────────

  describe("Anggota — create requires admin/pengurus/bendahara", () => {
    const body = { nik: "9999999999999991", nama: "RBAC Member", tempatLahir: "Jakarta", tanggalLahir: "1990-01-01", jenisKelamin: "laki_laki", alamat: "Jl. Test", pekerjaan: "Test", noTelepon: "081234567899" };
    it("admin → 201", async () => expect((await req("POST", "/api/anggota", adminToken, body)).status).toBe(201));
    it("pengurus → 201", async () => expect((await req("POST", "/api/anggota", pengurusToken, { ...body, nik: "9999999999999992" })).status).toBe(201));
    it("bendahara → 201", async () => expect((await req("POST", "/api/anggota", bendaharaToken, { ...body, nik: "9999999999999993" })).status).toBe(201));
    it("anggota → 403", async () => expect((await req("POST", "/api/anggota", anggotaToken, { ...body, nik: "9999999999999994" })).status).toBe(403));
    it("pengawas → 403", async () => expect((await req("POST", "/api/anggota", pengawasToken, { ...body, nik: "9999999999999995" })).status).toBe(403));
  });

  describe("Anggota — activate requires admin/pengurus", () => {
    it("admin → 404 (no such member)", async () => expect((await req("PATCH", "/api/anggota/fake-id/activate", adminToken)).status).toBe(404));
    it("pengurus → 404", async () => expect((await req("PATCH", "/api/anggota/fake-id/activate", pengurusToken)).status).toBe(404));
    it("bendahara → 403", async () => expect((await req("PATCH", "/api/anggota/fake-id/activate", bendaharaToken)).status).toBe(403));
    it("anggota → 403", async () => expect((await req("PATCH", "/api/anggota/fake-id/activate", anggotaToken)).status).toBe(403));
  });

  // ── SIMPANAN ─────────────────────────────────────────────────────────────

  describe("Simpanan — create requires admin/pengurus/bendahara", () => {
    const body = { anggotaId: "00000000-0000-0000-0000-000000000000", jenis: "wajib", jumlah: "50000", tanggal: "2025-01-15" };
    it("admin → 404", async () => expect((await req("POST", "/api/simpanan", adminToken, body)).status).toBe(404));
    it("pengurus → 404", async () => expect((await req("POST", "/api/simpanan", pengurusToken, body)).status).toBe(404));
    it("bendahara → 404", async () => expect((await req("POST", "/api/simpanan", bendaharaToken, body)).status).toBe(404));
    it("anggota → 403", async () => expect((await req("POST", "/api/simpanan", anggotaToken, body)).status).toBe(403));
    it("pengawas → 403", async () => expect((await req("POST", "/api/simpanan", pengawasToken, body)).status).toBe(403));
  });

  // ── PINJAMAN ─────────────────────────────────────────────────────────────

  describe("Pinjaman — approve requires admin/pengurus", () => {
    it("admin → 404", async () => expect((await req("PATCH", "/api/pinjaman/fake/approve", adminToken)).status).toBe(404));
    it("pengurus → 404", async () => expect((await req("PATCH", "/api/pinjaman/fake/approve", pengurusToken)).status).toBe(404));
    it("bendahara → 403", async () => expect((await req("PATCH", "/api/pinjaman/fake/approve", bendaharaToken)).status).toBe(403));
    it("anggota → 403", async () => expect((await req("PATCH", "/api/pinjaman/fake/approve", anggotaToken)).status).toBe(403));
  });

  describe("Pinjaman — cair requires admin/pengurus/bendahara", () => {
    it("admin → 404", async () => expect((await req("PATCH", "/api/pinjaman/fake/cair", adminToken)).status).toBe(404));
    it("pengurus → 404", async () => expect((await req("PATCH", "/api/pinjaman/fake/cair", pengurusToken)).status).toBe(404));
    it("bendahara → 404", async () => expect((await req("PATCH", "/api/pinjaman/fake/cair", bendaharaToken)).status).toBe(404));
    it("anggota → 403", async () => expect((await req("PATCH", "/api/pinjaman/fake/cair", anggotaToken)).status).toBe(403));
  });

  // ── TAGIHAN ──────────────────────────────────────────────────────────────

  describe("Tagihan — generate requires admin/pengurus/bendahara", () => {
    const body = { periode: "2025-01", jumlah: "50000" };
    it("admin → 200", async () => expect((await req("POST", "/api/tagihan/generate", adminToken, body)).status).toBe(200));
    it("pengurus → 200", async () => expect((await req("POST", "/api/tagihan/generate", pengurusToken, body)).status).toBe(200));
    it("bendahara → 200", async () => expect((await req("POST", "/api/tagihan/generate", bendaharaToken, body)).status).toBe(200));
    it("anggota → 403", async () => expect((await req("POST", "/api/tagihan/generate", anggotaToken, body)).status).toBe(403));
  });

  describe("Tagihan — bayar requires admin/bendahara", () => {
    const body = { tagihanId: "fake", tanggalBayar: "2025-01-20" };
    it("admin → 200", async () => expect((await req("POST", "/api/tagihan/bayar", adminToken, body)).status).toBe(200));
    it("bendahara → 200", async () => expect((await req("POST", "/api/tagihan/bayar", bendaharaToken, body)).status).toBe(200));
    it("pengurus → 403", async () => expect((await req("POST", "/api/tagihan/bayar", pengurusToken, body)).status).toBe(403));
  });

  // ── DASHBOARD (no super_admin) ──────────────────────────────────────────

  describe("Dashboard — requires admin/pengurus/bendahara/pengawas", () => {
    it("admin → 200", async () => expect((await req("GET", "/api/dashboard/ringkasan", adminToken)).status).toBe(200));
    it("pengurus → 200", async () => expect((await req("GET", "/api/dashboard/ringkasan", pengurusToken)).status).toBe(200));
    it("bendahara → 200", async () => expect((await req("GET", "/api/dashboard/ringkasan", bendaharaToken)).status).toBe(200));
    it("pengawas → 200", async () => expect((await req("GET", "/api/dashboard/ringkasan", pengawasToken)).status).toBe(200));
    it("anggota → 403", async () => expect((await req("GET", "/api/dashboard/ringkasan", anggotaToken)).status).toBe(403));
  });

  // ── SHU ─────────────────────────────────────────────────────────────────

  describe("SHU — hitung requires super_admin/admin/pengurus", () => {
    const body = { periode: "2020" };
    it("admin → 200 (no laba, but route accessible)", async () => {
      const r = await req("POST", "/api/shu/hitung", adminToken, body);
      expect(r.status === 200 || r.status === 400).toBe(true); // 200=success, 400=no laba
    });
    it("bendahara → 403", async () => expect((await req("POST", "/api/shu/hitung", bendaharaToken, body)).status).toBe(403));
    it("anggota → 403", async () => expect((await req("POST", "/api/shu/hitung", anggotaToken, body)).status).toBe(403));
  });

  describe("SHU — bagikan requires super_admin/admin/bendahara", () => {
    it("admin → 404", async () => expect((await req("PATCH", "/api/shu/fake/bagikan", adminToken)).status).toBe(404));
    it("bendahara → 404", async () => expect((await req("PATCH", "/api/shu/fake/bagikan", bendaharaToken)).status).toBe(404));
    it("pengurus → 403", async () => expect((await req("PATCH", "/api/shu/fake/bagikan", pengurusToken)).status).toBe(403));
  });

  describe("SHU — hapus requires super_admin/admin", () => {
    it("admin → 404 (non-existent SHU)", async () => expect((await req("DELETE", "/api/shu/fake", adminToken)).status).toBe(404));
    it("pengurus → 403", async () => expect((await req("DELETE", "/api/shu/fake", pengurusToken)).status).toBe(403));
    it("bendahara → 403", async () => expect((await req("DELETE", "/api/shu/fake", bendaharaToken)).status).toBe(403));
  });

  // ── RAT ─────────────────────────────────────────────────────────────────

  describe("RAT — buat requires super_admin/admin/pengurus", () => {
    const body = { periode: "2099", tanggalRAT: "2100-01-01", tempat: "Test" };
    it("admin → 201", async () => expect((await req("POST", "/api/rat", adminToken, body)).status).toBe(201));
    it("bendahara → 403", async () => expect((await req("POST", "/api/rat", bendaharaToken, { ...body, periode: "2098" })).status).toBe(403));
    it("anggota → 403", async () => expect((await req("POST", "/api/rat", anggotaToken, { ...body, periode: "2097" })).status).toBe(403));
  });

  describe("RAT — hapus requires super_admin/admin", () => {
    it("admin → 404", async () => expect((await req("DELETE", "/api/rat/fake", adminToken)).status).toBe(404));
    it("pengurus → 403", async () => expect((await req("DELETE", "/api/rat/fake", pengurusToken)).status).toBe(403));
    it("bendahara → 403", async () => expect((await req("DELETE", "/api/rat/fake", bendaharaToken)).status).toBe(403));
  });

  // ── USERS ────────────────────────────────────────────────────────────────

  describe("Users — requires super_admin/admin", () => {
    it("admin → 200", async () => expect((await req("GET", "/api/users", adminToken)).status).toBe(200));
    it("pengurus → 403", async () => expect((await req("GET", "/api/users", pengurusToken)).status).toBe(403));
    it("bendahara → 403", async () => expect((await req("GET", "/api/users", bendaharaToken)).status).toBe(403));
    it("anggota → 403", async () => expect((await req("GET", "/api/users", anggotaToken)).status).toBe(403));
  });

  // ── AUDIT ────────────────────────────────────────────────────────────────

  describe("Audit — requires admin/pengurus/pengawas", () => {
    it("admin → 200", async () => expect((await req("GET", "/api/audit", adminToken)).status).toBe(200));
    it("pengurus → 200", async () => expect((await req("GET", "/api/audit", pengurusToken)).status).toBe(200));
    it("pengawas → 200", async () => expect((await req("GET", "/api/audit", pengawasToken)).status).toBe(200));
    it("bendahara → 403", async () => expect((await req("GET", "/api/audit", bendaharaToken)).status).toBe(403));
    it("anggota → 403", async () => expect((await req("GET", "/api/audit", anggotaToken)).status).toBe(403));
  });

  // ── AUTH / ME (any authenticated user) ─────────────────────────────────────

  describe("GET /api/auth/me — any authenticated user", () => {
    it("admin → 200", async () => expect((await req("GET", "/api/auth/me", adminToken)).status).toBe(200));
    it("anggota → 200", async () => expect((await req("GET", "/api/auth/me", anggotaToken)).status).toBe(200));
    it("no token → 401", async () => expect((await req("GET", "/api/auth/me", null)).status).toBe(401));
  });
});
