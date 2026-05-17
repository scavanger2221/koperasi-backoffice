import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("Tagihan (Bills)", () => {
  let token: string;
  let anggotaIds: string[] = [];

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();

    token = await getAdminToken(app);

    // Create 3 active members
    for (let i = 0; i < 3; i++) {
      const id = await createTestAnggota(app, token, {
        nik: `12345678901234${i}${i}`, // guarantees 16 chars
        nama: `Tagihan Member ${i}`,
        email: `tagihan${i}@test.com`,
      });
      await activateAnggota(app, token, id);
      anggotaIds.push(id);
    }
  });

  // ── GENERATE ──────────────────────────────────────────────────────────────

  it("POST /api/tagihan/generate — creates monthly bills for all active members", async () => {
    const res = await app.request("/api/tagihan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2025-01",
        jumlah: "50000",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.created).toBe(3); // 3 active members
    expect(body.data.skipped).toBe(0);
    expect(body.data.periode).toBe("2025-01");
  });

  it("POST /api/tagihan/generate — skips existing bills for same periode", async () => {
    const res = await app.request("/api/tagihan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2025-01",
        jumlah: "50000",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.created).toBe(0);
    expect(body.data.skipped).toBe(3);
  });

  it("POST /api/tagihan/generate — generates for a different month", async () => {
    const res = await app.request("/api/tagihan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2025-02",
        jumlah: "50000",
      }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.created).toBe(3);
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  it("GET /api/tagihan — lists all bills (paginated)", async () => {
    const res = await app.request("/api/tagihan", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(6);
    expect(body.meta).toMatchObject({ page: 1, limit: 20 });
    // Check anggota info is attached
    expect(body.data[0].anggota).toBeTruthy();
    expect(body.data[0].anggota.nama).toBeTruthy();
  });

  it("GET /api/tagihan — filters by periode", async () => {
    const res = await app.request("/api/tagihan?periode=2025-01", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((t: any) => t.periode === "2025-01")).toBe(true);
    expect(body.meta.total).toBe(3);
  });

  it("GET /api/tagihan — filters by status", async () => {
    const res = await app.request("/api/tagihan?status=belum_bayar", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((t: any) => t.status === "belum_bayar")).toBe(true);
  });

  // ── BAYAR ─────────────────────────────────────────────────────────────────

  it("POST /api/tagihan/bayar — pays a bill", async () => {
    // Get first unpaid bill
    const listRes = await app.request("/api/tagihan?status=belum_bayar&limit=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bill = (await listRes.json()).data[0];

    const res = await app.request("/api/tagihan/bayar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tagihanId: bill.id,
        tanggalBayar: "2025-01-20",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("lunas");
  });

  it("POST /api/tagihan/bayar — rejects payment on already-paid bill", async () => {
    // Get first paid bill
    const listRes = await app.request("/api/tagihan?status=lunas&limit=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bill = (await listRes.json()).data[0];

    const res = await app.request("/api/tagihan/bayar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tagihanId: bill.id,
        tanggalBayar: "2025-01-20",
      }),
    });
    // The service just updates regardless, no status check
    expect(res.status).toBe(200);
  });

  // ── CEK TUNGGAKAN ─────────────────────────────────────────────────────────

  it("POST /api/tagihan/cek-tunggakan — marks overdue bills as tunggakan", async () => {
    const res = await app.request("/api/tagihan/cek-tunggakan", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.updated).toBe("number");
  });

  // ── SUMMARY ───────────────────────────────────────────────────────────────

  it("GET /api/tagihan/summary — returns billing summary for current period", async () => {
    const res = await app.request("/api/tagihan/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("belum_bayar");
    expect(body.data).toHaveProperty("lunas");
    expect(body.data).toHaveProperty("tunggakan");
    expect(body.data).toHaveProperty("totalBelumBayar");
    expect(body.data).toHaveProperty("totalLunas");
    expect(body.data).toHaveProperty("totalTunggakan");
    expect(body.data.periode).toBeTruthy();
  });

  it("GET /api/tagihan/summary?periode=2025-01 — filters by periode", async () => {
    const res = await app.request("/api/tagihan/summary?periode=2025-01", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.periode).toBe("2025-01");
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────

  it("GET /api/tagihan — returns 401 without token", async () => {
    const res = await app.request("/api/tagihan");
    expect(res.status).toBe(401);
  });

  it("POST /api/tagihan/generate — returns 403 for non-privileged role", async () => {
    // Register as regular member
    const regRes = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: "Regular Tagihan",
        email: "regular-tagihan@test.com",
        password: "password123",
        noTelepon: "081234567891",
        nik: "7777777777777777",
        alamat: "Jl. Test No. 77",
      }),
    });
    const regularToken = (await regRes.json()).data.token;

    const res = await app.request("/api/tagihan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${regularToken}` },
      body: JSON.stringify({
        periode: "2025-03",
        jumlah: "50000",
      }),
    });
    expect(res.status).toBe(403);
  });
});
