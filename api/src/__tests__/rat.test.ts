import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initTestDb, seedAdmin, seedAkun, getAdminToken, createTestAnggota, activateAnggota } from "./setup.js";

describe("RAT (Rapat Anggota Tahunan)", () => {
  let token: string;
  let anggotaIds: string[] = [];
  let ratId: string;
  let perpanjangRatId: string;

  beforeAll(async () => {
    const { sqlite, testDb } = initTestDb();
    seedAkun(testDb);
    await seedAdmin(testDb);
    sqlite.close();

    token = await getAdminToken(app);

    // Create 3 active members for kehadiran testing
    for (let i = 0; i < 3; i++) {
      const id = await createTestAnggota(app, token, {
        nik: `88888888888888${i}${i}`,
        nama: `RAT Member ${i}`,
        email: `rat${i}@test.com`,
      });
      await activateAnggota(app, token, id);
      anggotaIds.push(id);
    }
  });

  // ── BUAT ──────────────────────────────────────────────────────────────────

  it("POST /api/rat — creates a RAT in draft status (returns 201)", async () => {
    const res = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2025",
        tanggalRAT: "2026-03-15",
        tempat: "Gedung Koperasi Lantai 3",
        catatan: "RAT Tahunan 2025",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.periode).toBe("2025");
    expect(body.data.status).toBe("draft");
    expect(body.data.tempat).toBe("Gedung Koperasi Lantai 3");
    expect(body.data.catatan).toBe("RAT Tahunan 2025");
    expect(body.data.totalAnggota).toBe(3);
    expect(body.data.totalHadir).toBe(0);
    expect(body.data.kuorum).toBe(false);
    ratId = body.data.id;
  });

  it("POST /api/rat — rejects duplicate periode", async () => {
    const res = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2025",
        tanggalRAT: "2026-03-20",
        tempat: "Another Room",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/rat — rejects missing required fields (Zod validator)", async () => {
    const res = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ periode: "2026" }),
    });
    expect(res.status).toBe(400);
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  it("PATCH /api/rat/:id — updates draft RAT", async () => {
    const res = await app.request(`/api/rat/${ratId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tempat: "Aula Baru", catatan: "Catatan diperbarui" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.tempat).toBe("Aula Baru");
    expect(body.data.catatan).toBe("Catatan diperbarui");
  });

  // ── GET ANGGOTA AKTIF ────────────────────────────────────────────────────

  it("GET /api/rat/anggota-aktif — lists active members for kehadiran form", async () => {
    const res = await app.request("/api/rat/anggota-aktif", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    expect(body.data[0]).toHaveProperty("id");
    expect(body.data[0]).toHaveProperty("nama");
  });

  // ── LIST ──────────────────────────────────────────────────────────────────

  it("GET /api/rat — lists all RAT records", async () => {
    const res = await app.request("/api/rat", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].status).toBe("draft");
  });

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  it("GET /api/rat/:id — returns full RAT detail", async () => {
    const res = await app.request(`/api/rat/${ratId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(ratId);
    expect(body.data.agendaList).toBeDefined();
    expect(body.data.dokumenList).toBeDefined();
    expect(body.data.kehadiranList).toBeDefined();
  });

  it("GET /api/rat/:id — returns 404 for non-existent RAT", async () => {
    const res = await app.request("/api/rat/00000000-0000-0000-0000-000000000000", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  // ── STATE MACHINE ─────────────────────────────────────────────────────────

  describe("RAT State Machine", () => {
    it("1. starts as 'draft'", async () => {
      const res = await app.request(`/api/rat/${ratId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect((await res.json()).data.status).toBe("draft");
    });

    it("2. PATCH /api/rat/:id/publikasi — changes to 'dipublikasi' + auto-generates agenda", async () => {
      const res = await app.request(`/api/rat/${ratId}/publikasi`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("dipublikasi");
      expect(body.data.agendaList.length).toBeGreaterThanOrEqual(6);
    });

    it("3. rejects publikasi on already-publikasi", async () => {
      const res = await app.request(`/api/rat/${ratId}/publikasi`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
    });

    // ── UPDATE DIPUBLIKASI ──────────────────────────────────────────────────

    it("PATCH /api/rat/:id — allows update on dipublikasi RAT", async () => {
      const res = await app.request(`/api/rat/${ratId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tempat: "Aula Utama", tanggalRAT: "2026-03-20" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.tempat).toBe("Aula Utama");
      expect(body.data.tanggalRAT).toBe("2026-03-20");
    });

    // ── AGENDA (add/delete before voting starts) ────────────────────────────

    it("POST /api/rat/:id/agenda — adds an agenda before voting", async () => {
      const res = await app.request(`/api/rat/${ratId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul: "Program Kerja Baru" }),
      });
      expect(res.status).toBe(201);
      expect((await res.json()).data.judul).toBe("Program Kerja Baru");
    });

    it("DELETE /api/rat/:id/agenda/:agendaId — deletes an agenda before voting", async () => {
      const detail = await (await app.request(`/api/rat/${ratId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      const agendaToDelete = detail.data.agendaList[detail.data.agendaList.length - 1];

      const res = await app.request(`/api/rat/${ratId}/agenda/${agendaToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      expect((await res.json()).data.deleted).toBe(true);
    });

    it("POST /api/rat/:id/agenda — rejects agenda after voting starts", async () => {
      await app.request(`/api/rat/${ratId}/mulai-voting`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await app.request(`/api/rat/${ratId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul: "Late Agenda" }),
      });
      expect(res.status).toBe(400);
    });

    // ── VOTE AGENDA ─────────────────────────────────────────────────────────

    it("PATCH /api/rat/:id/vote-agenda — votes on an agenda with counts", async () => {
      const detail = await (await app.request(`/api/rat/${ratId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      const agendaId = detail.data.agendaList[0].id;

      const res = await app.request(`/api/rat/${ratId}/vote-agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          agendaId,
          hasil: "setuju",
          suaraSetuju: 2,
          suaraTolak: 0,
          suaraDitunda: 1,
          catatan: "Disetujui bersama",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      const votedAgenda = body.data.agendaList.find((a: any) => a.id === agendaId);
      expect(votedAgenda.hasilVoting).toBe("setuju");
      expect(votedAgenda.suaraSetuju).toBe(2);
      expect(votedAgenda.suaraTolak).toBe(0);
      expect(votedAgenda.suaraDitunda).toBe(1);
    });

    it("rejects invalid voting value (Zod validator)", async () => {
      const detail = await (await app.request(`/api/rat/${ratId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      const agendaId = detail.data.agendaList[1].id;

      const res = await app.request(`/api/rat/${ratId}/vote-agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agendaId, hasil: "invalid", catatan: "test" }),
      });
      expect(res.status).toBe(400);
    });

    // ── KEHADIRAN ───────────────────────────────────────────────────────────

    it("POST /api/rat/:id/kehadiran — records attendance for RAT members", async () => {
      const res = await app.request(`/api/rat/${ratId}/kehadiran`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kehadiran: [
            { anggotaId: anggotaIds[0], hadir: true, suratKuasa: false },
            { anggotaId: anggotaIds[1], hadir: true, suratKuasa: false },
            { anggotaId: anggotaIds[2], hadir: false, suratKuasa: true },
          ],
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.kehadiranList.length).toBe(3);
      expect(body.data.totalHadir).toBe(2);
      const attending = body.data.kehadiranList.filter((k: any) => k.hadir === true);
      expect(attending.length).toBe(2);
    });

    // ── SAHKAN ──────────────────────────────────────────────────────────────

    it("PATCH /api/rat/:id/sahkan — changes to 'disahkan'", async () => {
      const res = await app.request(`/api/rat/${ratId}/sahkan`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("disahkan");
      expect(body.data.dokumenList.some((d: any) => d.tipe === "notulensi")).toBe(true);
    });

    it("rejects sahkan on already-sahkan", async () => {
      const res = await app.request(`/api/rat/${ratId}/sahkan`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(400);
    });

    // ── DOKUMEN ─────────────────────────────────────────────────────────────

    it("POST /api/rat/:id/generate-laporan — generates a document", async () => {
      const res = await app.request(`/api/rat/${ratId}/generate-laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipe: "lpj_pengurus" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.tipe).toBe("lpj_pengurus");
      expect(body.data.status).toBe("final");
      expect(body.data.content).toBeDefined();
    });

    it("POST /api/rat/:id/generate-laporan — rejects invalid tipe", async () => {
      const res = await app.request(`/api/rat/${ratId}/generate-laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipe: "invalid_tipe" }),
      });
      expect(res.status).toBe(400);
    });

    it("POST /api/rat/:id/generate-laporan — returns existing document if already generated", async () => {
      const res = await app.request(`/api/rat/${ratId}/generate-laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipe: "lpj_pengurus" }),
      });
      expect(res.status).toBe(200);
    });

    it("GET /api/rat/:id/dokumen/:dokId — returns a document", async () => {
      const detail = await (await app.request(`/api/rat/${ratId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      const dokumen = detail.data.dokumenList.find((d: any) => d.tipe === "lpj_pengurus");
      expect(dokumen).toBeDefined();

      const res = await app.request(`/api/rat/${ratId}/dokumen/${dokumen.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(dokumen.id);
      expect(body.data.content).toBeDefined();
    });
  });

  // ── PERPANJANG & CLONE ────────────────────────────────────────────────────

  it("POST /api/rat — creates a RAT for perpanjang test", async () => {
    const res = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2024",
        tanggalRAT: "2025-03-15",
        tempat: "Ruang Rapat",
      }),
    });
    expect(res.status).toBe(201);
    perpanjangRatId = (await res.json()).data.id;
  });

  it("PATCH /api/rat/:id/perpanjang — perpanjang voting RAT", async () => {
    // Publish and start voting first
    await app.request(`/api/rat/${perpanjangRatId}/publikasi`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    await app.request(`/api/rat/${perpanjangRatId}/mulai-voting`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await app.request(`/api/rat/${perpanjangRatId}/perpanjang`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ catatan: "Kuorum tidak tercapai" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("diperpanjang");
  });

  it("POST /api/rat/:id/clone — clones diperpanjang RAT to new draft", async () => {
    const res = await app.request(`/api/rat/${perpanjangRatId}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ catatan: "Clone untuk RAT ulang" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe("draft");
    expect(body.data.agendaList.length).toBeGreaterThanOrEqual(6);

    // Clean up cloned RAT
    await app.request(`/api/rat/${body.data.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  it("rejects clone on non-diperpanjang RAT", async () => {
    const res = await app.request(`/api/rat/${ratId}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  // ── HAPUS ─────────────────────────────────────────────────────────────────

  it("POST /api/rat and test full lifecycle delete", async () => {
    const createRes = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2023",
        tanggalRAT: "2024-03-10",
        tempat: "Test Delete Room",
      }),
    });
    const deleteRatId = (await createRes.json()).data.id;

    const res = await app.request(`/api/rat/${deleteRatId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).data.deleted).toBe(true);

    const verifyRes = await app.request(`/api/rat/${deleteRatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(verifyRes.status).toBe(404);
  });

  it("rejects delete on non-draft RAT (disahkan)", async () => {
    const res = await app.request(`/api/rat/${ratId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  // ── AUTH ─────────────────────────────────────────────────────────────────

  it("GET /api/rat — returns 401 without token", async () => {
    const res = await app.request("/api/rat");
    expect(res.status).toBe(401);
  });

  it("POST /api/rat — returns 403 for bendahara role", async () => {
    await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: "bendahara-rat@test.com",
        password: "password123",
        nama: "Bendahara RAT",
        role: "bendahara",
      }),
    });

    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bendahara-rat@test.com", password: "password123" }),
    });
    const bToken = (await loginRes.json()).data.token;

    const res = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bToken}` },
      body: JSON.stringify({
        periode: "2026",
        tanggalRAT: "2027-03-15",
        tempat: "Secret Room",
      }),
    });
    expect(res.status).toBe(403);
  });

  // ── EXPORT ────────────────────────────────────────────────────────────────

  it("GET /api/rat/:id/export/xlsx — exports RAT to XLSX", async () => {
    // Create a RAT first
    const createRes = await app.request("/api/rat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        periode: "2026",
        tanggalRAT: "2026-03-20",
        tempat: "Aula Koperasi",
      }),
    });
    const exportRatId = (await createRes.json()).data.id;

    const res = await app.request(`/api/rat/${exportRatId}/export/xlsx`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("GET /api/rat/:id/export/pdf — exports RAT to PDF", async () => {
    const res = await app.request(`/api/rat/${ratId}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });
});
