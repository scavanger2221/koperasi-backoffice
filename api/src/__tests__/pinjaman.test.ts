import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("Pinjaman (Loans)", () => {
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
  });

  // ── AJUKAN ────────────────────────────────────────────────────────────────

  it("POST /api/pinjaman — creates a loan submission", async () => {
    const res = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jumlah: "10000000",
        bungaPersen: "12",
        jenisBunga: "flat",
        jangkaWaktu: 12,
        keterangan: "Modal usaha",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.noPinjaman).toMatch(/^PJ\d+$/);
  });

  it("POST /api/pinjaman — rejects non-existent member", async () => {
    const res = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId: "00000000-0000-0000-0000-000000000000",
        jumlah: "5000000",
        bungaPersen: "12",
        jenisBunga: "flat",
        jangkaWaktu: 6,
      }),
    });
    expect(res.status).toBe(404);
  });

  it("POST /api/pinjaman — rejects invalid jumlah format", async () => {
    const res = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jumlah: "abc",
        bungaPersen: "12",
        jenisBunga: "flat",
        jangkaWaktu: 6,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/pinjaman — rejects invalid jangkaWaktu", async () => {
    const res = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jumlah: "5000000",
        bungaPersen: "12",
        jenisBunga: "flat",
        jangkaWaktu: 0,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/pinjaman — rejects jangkaWaktu > 60", async () => {
    const res = await app.request("/api/pinjaman", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        anggotaId,
        jumlah: "5000000",
        bungaPersen: "12",
        jenisBunga: "flat",
        jangkaWaktu: 61,
      }),
    });
    expect(res.status).toBe(400);
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  it("GET /api/pinjaman — lists all loans (paginated)", async () => {
    const res = await app.request("/api/pinjaman", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    // Check anggota info attached
    expect(body.data[0].anggota).toBeTruthy();
  });

  it("GET /api/pinjaman — filters by status", async () => {
    const res = await app.request("/api/pinjaman?status=diajukan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((p: any) => p.status === "diajukan")).toBe(true);
  });

  // ── STATE MACHINE ─────────────────────────────────────────────────────────

  describe("Loan state machine", () => {
    let loanId: string;

    beforeAll(async () => {
      const res = await app.request("/api/pinjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          anggotaId,
          jumlah: "2400000",
          bungaPersen: "12",
          jenisBunga: "flat",
          jangkaWaktu: 12,
        }),
      });
      loanId = (await res.json()).data.id;
    });

    it("1. status starts as 'diajukan'", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect((await res.json()).data.status).toBe("diajukan");
    });

    it("2. PATCH /api/pinjaman/:id/approve — changes status to 'disetujui'", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      expect((await res.json()).data.status).toBe("disetujui");
    });

    it("3. rejects approve on already-approved loan", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
    });

    it("4. PATCH /api/pinjaman/:id/cair — changes status to 'aktif' and generates angsuran schedule", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}/cair`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("aktif");

      // Verify angsuran schedule was created
      const detail = await (await app.request(`/api/pinjaman/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      expect(detail.data.angsuran.length).toBe(12); // 12 months
      expect(detail.data.angsuran[0].angsuranKe).toBe(1);
      expect(detail.data.angsuran[0].status).toBe("belum_lunas");
    });

    it("5. rejects cair on already-cair loan", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}/cair`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
    });

    it("6. rejects approve on active loan", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
    });

    it("7. GET /api/pinjaman/:id — returns full detail with angsuran + anggota", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.angsuran).toBeDefined();
      expect(body.data.anggota).toBeDefined();
      expect(body.data.anggota.nama).toBe("Test Member");
    });
  });

  // ── BAYAR ANGSURAN ───────────────────────────────────────────────────────

  describe("Bayar Angsuran", () => {
    let loanId: string;

    beforeAll(async () => {
      // Create loan through full flow
      const createRes = await app.request("/api/pinjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          anggotaId,
          jumlah: "6000000",
          bungaPersen: "12",
          jenisBunga: "flat",
          jangkaWaktu: 6,
        }),
      });
      loanId = (await createRes.json()).data.id;

      await app.request(`/api/pinjaman/${loanId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      await app.request(`/api/pinjaman/${loanId}/cair`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it("POST /api/pinjaman/bayar — pays the first installment", async () => {
      const res = await app.request("/api/pinjaman/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pinjamanId: loanId,
          tanggalBayar: "2025-02-01",
          metodeBayar: "transfer",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("lunas");
      expect(body.data.angsuranId).toBeTruthy();
    });

    it("POST /api/pinjaman/bayar — pays the second installment", async () => {
      const res = await app.request("/api/pinjaman/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pinjamanId: loanId,
          tanggalBayar: "2025-03-01",
          metodeBayar: "tunai",
        }),
      });
      expect(res.status).toBe(200);
    });

    it("Pays remaining 4 installments to clear the loan", async () => {
      for (let i = 3; i <= 6; i++) {
        const res = await app.request("/api/pinjaman/bayar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            pinjamanId: loanId,
            tanggalBayar: `2025-${String(i).padStart(2, "0")}-01`,
            metodeBayar: "qris",
          }),
        });
        expect(res.status).toBe(200);
      }
    });

    it("loan status becomes 'lunas' after all installments paid", async () => {
      const res = await app.request(`/api/pinjaman/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect((await res.json()).data.status).toBe("lunas");
    });

    it("returns 400 when trying to pay a fully paid loan", async () => {
      const res = await app.request("/api/pinjaman/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pinjamanId: loanId,
          tanggalBayar: "2025-08-01",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent loan", async () => {
      const res = await app.request("/api/pinjaman/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pinjamanId: "00000000-0000-0000-0000-000000000000",
          tanggalBayar: "2025-02-01",
        }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ── CEK DENDA ─────────────────────────────────────────────────────────────

  it("POST /api/pinjaman/cek-denda — calculates and updates penalties", async () => {
    const res = await app.request("/api/pinjaman/cek-denda", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.updated).toBe("number");
  });

  // ── KOLEKTIBILITAS ───────────────────────────────────────────────────────

  describe("Kolektibilitas", () => {
    it("GET /api/pinjaman/kolektibilitas/summary — returns kolektibilitas counts", async () => {
      const res = await app.request("/api/pinjaman/kolektibilitas/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("1");
      expect(body.data).toHaveProperty("2");
      expect(body.data).toHaveProperty("3");
      expect(body.data).toHaveProperty("4");
    });

    it("GET /api/pinjaman/:id/kolektibilitas — returns kolektibilitas for a specific loan", async () => {
      // Create a loan
      const createRes = await app.request("/api/pinjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          anggotaId,
          jumlah: "1000000",
          bungaPersen: "12",
          jenisBunga: "flat",
          jangkaWaktu: 3,
        }),
      });
      const loanId = (await createRes.json()).data.id;

      const res = await app.request(`/api/pinjaman/${loanId}/kolektibilitas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(typeof body.data.kolektibilitas).toBe("number");
      expect(body.data.kolektibilitas).toBeGreaterThanOrEqual(1);
    });
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────

  it("GET /api/pinjaman — returns 401 without token", async () => {
    const res = await app.request("/api/pinjaman");
    expect(res.status).toBe(401);
  });

  it("GET /api/pinjaman/:id — returns 404 for non-existent loan", async () => {
    const res = await app.request("/api/pinjaman/00000000-0000-0000-0000-000000000000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });
});
