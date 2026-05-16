import { eq, desc, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { rat, ratAgenda, ratDokumen, ratKehadiran, anggota, shu } from "../../database/schema/index.js";

class RatService {
  // ── List all RAT ──
  async list() {
    const data = await db.select().from(rat).orderBy(desc(rat.periode));
    return { data };
  }

  // ── Get detail RAT by ID ──
  async getById(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    const agendaList = await db
      .select()
      .from(ratAgenda)
      .where(eq(ratAgenda.ratId, id))
      .orderBy(ratAgenda.createdAt);

    const dokumenList = await db
      .select()
      .from(ratDokumen)
      .where(eq(ratDokumen.ratId, id))
      .orderBy(ratDokumen.createdAt);

    const kehadiranRaw = await db
      .select({
        id: ratKehadiran.id,
        ratId: ratKehadiran.ratId,
        anggotaId: ratKehadiran.anggotaId,
        hadir: ratKehadiran.hadir,
        suratKuasa: ratKehadiran.suratKuasa,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(ratKehadiran)
      .innerJoin(anggota, eq(ratKehadiran.anggotaId, anggota.id))
      .where(eq(ratKehadiran.ratId, id))
      .orderBy(anggota.nama);

    const kehadiranList = kehadiranRaw.map((k) => ({
      id: k.id,
      ratId: k.ratId,
      anggotaId: k.anggotaId,
      hadir: k.hadir,
      suratKuasa: k.suratKuasa,
      anggota: { nama: k.anggotaNama, noAnggota: k.anggotaNo },
    }));

    return {
      ...r,
      agendaList,
      dokumenList,
      kehadiranList,
    };
  }

  // ── Create new RAT (status: DRAFT) ──
  async buat(data: { periode: string; tanggalRAT: string; tempat: string; catatan?: string }) {
    // Check duplicate periode
    const existing = await db.select().from(rat).where(eq(rat.periode, data.periode)).get();
    if (existing) {
      throw new HTTPException(400, {
        message: `RAT untuk periode ${data.periode} sudah ada.`,
      });
    }

    // Get total active members for initial kuorum calculation
    const activeMembers = await db
      .select({ id: anggota.id })
      .from(anggota)
      .where(eq(anggota.status, "aktif"));

    const totalAnggota = activeMembers.length;

    const id = crypto.randomUUID();
    await db.insert(rat).values({
      id,
      periode: data.periode,
      tanggalRAT: data.tanggalRAT,
      tempat: data.tempat,
      catatan: data.catatan,
      totalAnggota,
      totalHadir: 0,
      kuorum: false,
      status: "draft",
    });

    return this.getById(id);
  }

  // ── Update RAT ──
  async update(id: string, data: { tanggalRAT?: string; tempat?: string; catatan?: string }) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft") {
      throw new HTTPException(400, { message: "Hanya RAT draft yang bisa diedit" });
    }

    await db.update(rat).set(data).where(eq(rat.id, id));
    return this.getById(id);
  }

  // ── Publikasi RAT (Draft → Dipublikasi) ──
  async publikasi(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft") {
      throw new HTTPException(400, { message: "Hanya RAT draft yang bisa dipublikasi" });
    }

    // Auto-generate default agenda items
    const defaultAgenda = [
      "Laporan Pertanggungjawaban Pengurus",
      "Laporan Keuangan & Pengesahan SHU",
      "Laporan Pengawas",
      "Pembahasan & Pengesahan SHU",
      "Rencana Kerja Tahun Berikutnya",
      "RAPB Tahun Berikutnya",
    ];

    for (const judul of defaultAgenda) {
      await db.insert(ratAgenda).values({
        id: crypto.randomUUID(),
        ratId: id,
        judul,
      });
    }

    await db.update(rat).set({ status: "dipublikasi" }).where(eq(rat.id, id));
    return this.getById(id);
  }

  // ── Add agenda to RAT ──
  async addAgenda(ratId: string, judul: string) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft" && r.status !== "dipublikasi") {
      throw new HTTPException(400, { message: "Tidak bisa tambah agenda pada status ini" });
    }

    const id = crypto.randomUUID();
    await db.insert(ratAgenda).values({ id, ratId, judul });
    return { id, ratId, judul };
  }

  // ── Record voting result for an agenda ──
  async voteAgenda(ratId: string, agendaId: string, hasil: "setuju" | "ditolak" | "ditunda", catatan?: string) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "voting") {
      throw new HTTPException(400, { message: "RAT harus dalam status voting untuk mencatat hasil" });
    }

    const agenda = await db
      .select()
      .from(ratAgenda)
      .where(and(eq(ratAgenda.id, agendaId), eq(ratAgenda.ratId, ratId)))
      .get();

    if (!agenda) throw new HTTPException(404, { message: "Agenda tidak ditemukan" });

    await db
      .update(ratAgenda)
      .set({ hasilVoting: hasil, catatan })
      .where(eq(ratAgenda.id, agendaId));

    return this.getById(ratId);
  }

  // ── Catat kehadiran anggota ──
  async catatKehadiran(ratId: string, kehadiranList: { anggotaId: string; hadir: boolean; suratKuasa?: boolean }[]) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    // Delete existing kehadiran for this RAT to allow re-entry
    await db.delete(ratKehadiran).where(eq(ratKehadiran.ratId, ratId));

    for (const k of kehadiranList) {
      await db.insert(ratKehadiran).values({
        id: crypto.randomUUID(),
        ratId,
        anggotaId: k.anggotaId,
        hadir: k.hadir,
        suratKuasa: k.suratKuasa ?? false,
      });
    }

    // Recalculate totals
    const allKehadiran = await db
      .select()
      .from(ratKehadiran)
      .where(eq(ratKehadiran.ratId, ratId));

    const totalHadir = allKehadiran.filter((k) => k.hadir).length;
    const totalAnggota = r.totalAnggota;
    const kuorum = totalHadir > totalAnggota / 2; // 50%+1

    await db
      .update(rat)
      .set({ totalHadir, kuorum })
      .where(eq(rat.id, ratId));

    return this.getById(ratId);
  }

  // ── Start voting (Dipublikasi → Voting) ──
  async mulaiVoting(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "dipublikasi") {
      throw new HTTPException(400, { message: "Hanya RAT yang sudah dipublikasi yang bisa masuk voting" });
    }

    await db.update(rat).set({ status: "voting" }).where(eq(rat.id, id));
    return this.getById(id);
  }

  // ── Sahkan RAT (Voting → Disahkan) ──
  async sahkan(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "voting") {
      throw new HTTPException(400, { message: "Hanya RAT dalam voting yang bisa disahkan" });
    }

    if (!r.kuorum) {
      throw new HTTPException(400, {
        message: `Kuorum tidak terpenuhi (hadir: ${r.totalHadir}/${r.totalAnggota}). Minimal 50%+1. Gunakan 'perpanjang' untuk RAT ulang.`,
      });
    }

    // Generate notulensi otomatis
    const agendaList = await db
      .select()
      .from(ratAgenda)
      .where(eq(ratAgenda.ratId, id));

    const notulensi = agendaList
      .map((a) => `- ${a.judul}: ${a.hasilVoting ?? "belum diputuskan"}${a.catatan ? ` (${a.catatan})` : ""}`)
      .join("\n");

    const catatan = `RAT ${r.periode} disahkan.\n\n=== Hasil Voting ===\n${notulensi}\n\n${r.catatan ?? ""}`;

    await db.update(rat).set({ status: "disahkan", catatan }).where(eq(rat.id, id));

    // Auto-generate notulensi document
    await db.insert(ratDokumen).values({
      id: crypto.randomUUID(),
      ratId: id,
      nama: `Notulensi RAT ${r.periode}`,
      tipe: "notulensi",
      status: "final",
    });

    return this.getById(id);
  }

  // ── Perpanjang RAT (Voting → Diperpanjang, kuorum tidak terpenuhi) ──
  async perpanjang(id: string, catatan?: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "voting") {
      throw new HTTPException(400, { message: "Hanya RAT dalam voting yang bisa diperpanjang" });
    }

    await db
      .update(rat)
      .set({
        status: "diperpanjang",
        catatan: catatan
          ? `${r.catatan ?? ""}\n\n[RAT Ulang] ${catatan}`
          : `${r.catatan ?? ""}\n\n[RAT Ulang] Kuorum tidak terpenuhi (hadir: ${r.totalHadir}/${r.totalAnggota})`,
      })
      .where(eq(rat.id, id));

    return this.getById(id);
  }

  // ── Hapus RAT draft ──
  async hapus(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft" && r.status !== "diperpanjang") {
      throw new HTTPException(400, { message: "Hanya RAT draft atau diperpanjang yang bisa dihapus" });
    }

    // Cascade delete
    await db.delete(ratKehadiran).where(eq(ratKehadiran.ratId, id));
    await db.delete(ratDokumen).where(eq(ratDokumen.ratId, id));
    await db.delete(ratAgenda).where(eq(ratAgenda.ratId, id));
    await db.delete(rat).where(eq(rat.id, id));

    return { deleted: true };
  }

  // ── Generate dokumen laporan dari data sistem ──
  async generateLaporan(id: string, tipe: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    const tipeValid = ["lpj_pengurus", "laporan_keuangan", "laporan_pengawas", "shu", "rencana_kerja", "rapb"] as const;
    if (!tipeValid.includes(tipe as any)) {
      throw new HTTPException(400, { message: `Tipe dokumen tidak valid: ${tipe}` });
    }

    // Check if already exists
    const existing = await db
      .select()
      .from(ratDokumen)
      .where(and(eq(ratDokumen.ratId, id), eq(ratDokumen.tipe, tipe as any)))
      .get();

    if (existing) {
      return existing;
    }

    const namaMap: Record<string, string> = {
      lpj_pengurus: `LPJ Pengurus ${r.periode}`,
      laporan_keuangan: `Laporan Keuangan ${r.periode}`,
      laporan_pengawas: `Laporan Pengawas ${r.periode}`,
      shu: `Perhitungan SHU ${r.periode}`,
      rencana_kerja: `Rencana Kerja ${r.periode}`,
      rapb: `RAPB ${r.periode}`,
    };

    const dokId = crypto.randomUUID();
    await db.insert(ratDokumen).values({
      id: dokId,
      ratId: id,
      nama: namaMap[tipe] ?? `Dokumen ${tipe} ${r.periode}`,
      tipe: tipe as any,
      status: "final",
    });

    return { id: dokId, nama: namaMap[tipe], tipe, status: "final" };
  }

  // ── Get active members list for kehadiran ──
  async getAnggotaAktif() {
    const data = await db
      .select({
        id: anggota.id,
        noAnggota: anggota.noAnggota,
        nama: anggota.nama,
      })
      .from(anggota)
      .where(eq(anggota.status, "aktif"))
      .orderBy(anggota.nama);

    return { data };
  }
}

export const ratService = new RatService();
