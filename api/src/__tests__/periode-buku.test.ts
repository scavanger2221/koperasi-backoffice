import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken } from "./setup.js";

describe("Periode Buku", () => {
  let token: string;
  let periodeId: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();
    token = await getAdminToken(app);
  });

  // ── LIST (empty) ──────────────────────────────────────────────────────────

  it("GET /api/periode-buku — returns empty list", async () => {
    const res = await app.request("/api/periode-buku", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  // ── GET AKTIF (empty) ─────────────────────────────────────────────────────

  it("GET /api/periode-buku/aktif — returns null when no period is open", async () => {
    const res = await app.request("/api/periode-buku/aktif", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  // ── CREATE ────────────────────────────────────────────────────────────────

  it("POST /api/periode-buku — creates a period", async () => {
    const res = await app.request("/api/periode-buku", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tahun: 2026,
        tanggalMulai: "2026-01-01",
        tanggalSelesai: "2026-12-31",
        keterangan: "Tahun buku 2026",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.tahun).toBe(2026);
    expect(body.data.status).toBe("buka");
    periodeId = body.data.id;
  });

  it("POST /api/periode-buku — rejects duplicate year", async () => {
    const res = await app.request("/api/periode-buku", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tahun: 2026,
        tanggalMulai: "2026-01-01",
        tanggalSelesai: "2026-12-31",
      }),
    });
    expect(res.status).toBe(400);
  });

  // ── LIST (after create) ───────────────────────────────────────────────────

  it("GET /api/periode-buku — lists periods", async () => {
    const res = await app.request("/api/periode-buku", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].tahun).toBe(2026);
    expect(body.data[0].status).toBe("buka");
  });

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  it("GET /api/periode-buku/:id — returns period detail", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(periodeId);
    expect(body.data.tahun).toBe(2026);
  });

  it("GET /api/periode-buku/:id — returns 404 for non-existent", async () => {
    const res = await app.request("/api/periode-buku/00000000-0000-0000-0000-000000000000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── GET AKTIF (after create) ──────────────────────────────────────────────

  it("GET /api/periode-buku/aktif — returns the open period", async () => {
    const res = await app.request("/api/periode-buku/aktif", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).not.toBeNull();
    expect(body.data.tahun).toBe(2026);
    expect(body.data.status).toBe("buka");
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  it("PATCH /api/periode-buku/:id — updates a period", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ keterangan: "Periode 2026 updated" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.keterangan).toBe("Periode 2026 updated");
  });

  it("PATCH /api/periode-buku/:id — returns 404 for non-existent", async () => {
    const res = await app.request("/api/periode-buku/00000000-0000-0000-0000-000000000000", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ keterangan: "Test" }),
    });
    expect(res.status).toBe(404);
  });

  // ── TUTUP BUKU ────────────────────────────────────────────────────────────

  it("PATCH /api/periode-buku/:id/tutup — closes the period", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}/tutup`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("tutup");
  });

  it("PATCH /api/periode-buku/:id/tutup — rejects double close", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}/tutup`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/periode-buku/:id/tutup — returns 404 for non-existent", async () => {
    const res = await app.request("/api/periode-buku/00000000-0000-0000-0000-000000000000/tutup", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── BUKA BUKU ─────────────────────────────────────────────────────────────

  it("PATCH /api/periode-buku/:id/buka — reopens the period", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}/buka`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("buka");
  });

  it("PATCH /api/periode-buku/:id/buka — rejects reopening already open", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}/buka`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  it("DELETE /api/periode-buku/:id — deletes an open period", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.deleted).toBe(true);
  });

  it("DELETE /api/periode-buku/:id — returns 404 after deletion", async () => {
    const res = await app.request(`/api/periode-buku/${periodeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/periode-buku/:id — rejects deleting closed period", async () => {
    // Create, close, then try to delete
    const createRes = await app.request("/api/periode-buku", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tahun: 2025,
        tanggalMulai: "2025-01-01",
        tanggalSelesai: "2025-12-31",
      }),
    });
    const id = (await createRes.json()).data.id;
    await app.request(`/api/periode-buku/${id}/tutup`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });

    const res = await app.request(`/api/periode-buku/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  // ── AUTH ──────────────────────────────────────────────────────────────────

  it("GET /api/periode-buku — returns 401 without token", async () => {
    const res = await app.request("/api/periode-buku");
    expect(res.status).toBe(401);
  });
});
