import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("Jurnal (Journal Entries)", () => {
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

    // Create some financial activity to generate journal entries
    // 1. Simpanan pokok
    await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jenis: "pokok", jumlah: "500000", tanggal: "2025-01-15" }),
    });
    // 2. Simpanan wajib
    await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jenis: "wajib", jumlah: "100000", tanggal: "2025-01-15" }),
    });
    // 3. Simpanan sukarela
    await app.request("/api/simpanan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jenis: "sukarela", jumlah: "250000", tanggal: "2025-02-01" }),
    });

    // 4. Create + approve + cair pinjaman
    const loanRes = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ anggotaId, jumlah: "2400000", bungaPersen: "12", jenisBunga: "flat", jangkaWaktu: 6 }),
    });
    const loanId = (await loanRes.json()).data.id;
    await app.request(`/api/pinjaman/${loanId}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    await app.request(`/api/pinjaman/${loanId}/cair`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });

    // 5. Pay one installment
    await app.request("/api/pinjaman/bayar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pinjamanId: loanId, tanggalBayar: "2025-02-01", metodeBayar: "tunai" }),
    });
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  it("GET /api/jurnal — lists all journal entries (paginated)", async () => {
    const res = await app.request("/api/jurnal", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(5); // 3 simpanan + 1 pencairan + 1 angsuran
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    // Each entry should have details with akun info
    expect(body.data[0].details).toBeDefined();
    expect(body.data[0].details.length).toBeGreaterThanOrEqual(2);
    expect(body.data[0].details[0].akunNama).toBeTruthy();
  });

  it("GET /api/jurnal — filters by date range", async () => {
    const res = await app.request("/api/jurnal?tanggalMulai=2025-01-01&tanggalSelesai=2025-01-31", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((j: any) => j.tanggal >= "2025-01-01" && j.tanggal <= "2025-01-31")).toBe(true);
  });

  it("GET /api/jurnal — paginates correctly", async () => {
    const res = await app.request("/api/jurnal?page=1&limit=2", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
  });

  // ── BUKU KAS ──────────────────────────────────────────────────────────────

  it("GET /api/jurnal/buku-kas — returns cash book entries", async () => {
    const res = await app.request("/api/jurnal/buku-kas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta).toBeDefined();
    // Each entry should have running saldo
    expect(body.data[0].saldo).toBeDefined();
  });

  it("GET /api/jurnal/buku-kas — filters by date range", async () => {
    const res = await app.request("/api/jurnal/buku-kas?tanggalMulai=2025-02-01&tanggalSelesai=2025-02-28", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── BUKU BESAR ────────────────────────────────────────────────────────────

  it("GET /api/jurnal/buku-besar/:akunId — returns general ledger for an account", async () => {
    // Get Kas account ID from neraca-saldo (wrapped in data.data)
    const neracaRes = await app.request("/api/jurnal/neraca-saldo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const neracaBody = await neracaRes.json();
    const kasAkun = neracaBody.data.data.find((r: any) => r.akun.kode === "1-1000");

    if (!kasAkun) return; // skip if no kas account

    const res = await app.request(`/api/jurnal/buku-besar/${kasAkun.akun.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.akun).toBeDefined();
    expect(body.akun.kode).toBe("1-1000");
    // Each entry should have running saldo
    expect(body.data[0].saldo).toBeDefined();
  });

  // ── NERACA SALDO ──────────────────────────────────────────────────────────

  it("GET /api/jurnal/neraca-saldo — returns trial balance", async () => {
    const res = await app.request("/api/jurnal/neraca-saldo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Controller wraps as: { success: true, data: { data: [...], totalDebit, totalKredit } }
    expect(Array.isArray(body.data.data)).toBe(true);
    expect(body.data.totalDebit).toBeDefined();
    expect(body.data.totalKredit).toBeDefined();
    // Debit and credit totals should be equal
    expect(body.data.totalDebit).toBe(body.data.totalKredit);
  });

  it("neraca-saldo contains proper account info", async () => {
    const res = await app.request("/api/jurnal/neraca-saldo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    const kas = body.data.data.find((r: any) => r.akun.kode === "1-1000");
    expect(kas).toBeDefined();
    expect(kas.debit).toBeGreaterThan(0);
    expect(kas.akun.tipe).toBe("aset");
  });

  // ── LABA RUGI ─────────────────────────────────────────────────────────────

  it("GET /api/jurnal/laba-rugi — returns income statement", async () => {
    const res = await app.request("/api/jurnal/laba-rugi", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("pendapatan");
    expect(body.data).toHaveProperty("biaya");
    expect(body.data).toHaveProperty("totalPendapatan");
    expect(body.data).toHaveProperty("totalBiaya");
    expect(body.data).toHaveProperty("labaRugi");
    expect(typeof body.data.isProfit).toBe("boolean");
  });

  it("GET /api/jurnal/laba-rugi — filters by date range", async () => {
    const res = await app.request("/api/jurnal/laba-rugi?tanggalMulai=2025-01-01&tanggalSelesai=2025-12-31", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  // ── NERACA ────────────────────────────────────────────────────────────────

  it("GET /api/jurnal/neraca — returns balance sheet", async () => {
    const res = await app.request("/api/jurnal/neraca", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("aset");
    expect(body.data).toHaveProperty("kewajiban");
    expect(body.data).toHaveProperty("ekuitas");
    expect(body.data).toHaveProperty("totalAset");
    expect(body.data).toHaveProperty("totalKewajiban");
    expect(body.data).toHaveProperty("totalEkuitas");
    // Assets should equal liabilities + equity
    expect(body.data.balanced).toBe(true);
    expect(body.data.totalAset).toBe(body.data.totalKewajiban + body.data.totalEkuitas);
  });

  // ── ARUS KAS ──────────────────────────────────────────────────────────────

  it("GET /api/jurnal/arus-kas — returns cash flow statement", async () => {
    const res = await app.request("/api/jurnal/arus-kas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("saldoAwal");
    expect(body.data).toHaveProperty("saldoAkhir");
    expect(body.data).toHaveProperty("operasi");
    expect(body.data).toHaveProperty("investasi");
    expect(body.data).toHaveProperty("pendanaan");
    expect(body.data).toHaveProperty("totalOperasi");
    expect(body.data).toHaveProperty("totalInvestasi");
    expect(body.data).toHaveProperty("totalPendanaan");
    expect(body.data).toHaveProperty("netCashFlow");
  });

  it("GET /api/jurnal/arus-kas — filters by date range", async () => {
    const res = await app.request("/api/jurnal/arus-kas?tanggalMulai=2025-01-01&tanggalSelesai=2025-12-31", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────

  it("GET /api/jurnal — returns 401 without token", async () => {
    const res = await app.request("/api/jurnal");
    expect(res.status).toBe(401);
  });
});
