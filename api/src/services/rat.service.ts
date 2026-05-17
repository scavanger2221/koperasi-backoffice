import { eq, desc, and, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { rat, ratAgenda, ratDokumen, ratKehadiran, anggota, shu, shuAnggota, simpanan, pinjaman } from "../../database/schema/index.js";
import { getNeraca, getLabaRugi, getArusKas } from "./jurnal.service.js";

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
    const existing = await db.select().from(rat).where(eq(rat.periode, data.periode)).get();
    if (existing) {
      throw new HTTPException(400, {
        message: `RAT untuk periode ${data.periode} sudah ada.`,
      });
    }

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

    if (r.status !== "draft" && r.status !== "dipublikasi") {
      throw new HTTPException(400, { message: "Hanya RAT draft atau dipublikasi yang bisa diedit" });
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

  // ── Delete agenda from RAT ──
  async hapusAgenda(ratId: string, agendaId: string) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft" && r.status !== "dipublikasi") {
      throw new HTTPException(400, { message: "Tidak bisa hapus agenda pada status ini" });
    }

    const agenda = await db
      .select()
      .from(ratAgenda)
      .where(and(eq(ratAgenda.id, agendaId), eq(ratAgenda.ratId, ratId)))
      .get();

    if (!agenda) throw new HTTPException(404, { message: "Agenda tidak ditemukan" });

    await db.delete(ratAgenda).where(eq(ratAgenda.id, agendaId));
    return { deleted: true };
  }

  // ── Record voting result for an agenda ──
  async voteAgenda(
    ratId: string,
    agendaId: string,
    hasil: "setuju" | "ditolak" | "ditunda",
    suaraSetuju: number,
    suaraTolak: number,
    suaraDitunda: number,
    catatan?: string
  ) {
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
      .set({ hasilVoting: hasil, suaraSetuju, suaraTolak, suaraDitunda, catatan })
      .where(eq(ratAgenda.id, agendaId));

    return this.getById(ratId);
  }

  // ── Catat kehadiran anggota ──
  async catatKehadiran(ratId: string, kehadiranList: { anggotaId: string; hadir: boolean; suratKuasa?: boolean }[]) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

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

    const allKehadiran = await db
      .select()
      .from(ratKehadiran)
      .where(eq(ratKehadiran.ratId, ratId));

    const totalHadir = allKehadiran.filter((k) => k.hadir).length;
    const totalAnggota = r.totalAnggota;
    const kuorum = totalHadir > totalAnggota / 2;

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

    const agendaList = await db
      .select()
      .from(ratAgenda)
      .where(eq(ratAgenda.ratId, id));

    const notulensi = agendaList
      .map((a) => {
        const voteInfo = a.suaraSetuju + a.suaraTolak + a.suaraDitunda > 0
          ? ` [${a.suaraSetuju} setuju, ${a.suaraTolak} menolak, ${a.suaraDitunda} ditunda]`
          : "";
        return `- ${a.judul}: ${a.hasilVoting ?? "belum diputuskan"}${voteInfo}${a.catatan ? ` (${a.catatan})` : ""}`;
      })
      .join("\n");

    const catatan = `RAT ${r.periode} disahkan.\n\n=== Hasil Voting ===\n${notulensi}\n\n${r.catatan ?? ""}`;

    await db.update(rat).set({ status: "disahkan", catatan }).where(eq(rat.id, id));

    // Auto-generate notulensi document with content
    const notulensiContent = this.buildNotulensiContent(r, agendaList);
    await db.insert(ratDokumen).values({
      id: crypto.randomUUID(),
      ratId: id,
      nama: `Notulensi RAT ${r.periode}`,
      tipe: "notulensi",
      status: "final",
      content: notulensiContent,
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

  // ── Clone RAT (Diperpanjang → new Draft) ──
  async cloneRat(id: string, catatan?: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "diperpanjang") {
      throw new HTTPException(400, { message: "Hanya RAT diperpanjang yang bisa di-clone" });
    }

    // Check if a RAT for this periode already exists (besides the current one)
    const existing = await db.select().from(rat).where(eq(rat.periode, r.periode)).all();
    const draftForPeriode = existing.find((x) => x.id !== id && x.status === "draft");
    if (draftForPeriode) {
      throw new HTTPException(400, { message: `Draft RAT untuk periode ${r.periode} sudah ada` });
    }

    const newId = crypto.randomUUID();
    const activeMembers = await db
      .select({ id: anggota.id })
      .from(anggota)
      .where(eq(anggota.status, "aktif"));

    await db.insert(rat).values({
      id: newId,
      periode: r.periode,
      status: "draft",
      tanggalRAT: r.tanggalRAT,
      tempat: r.tempat,
      totalAnggota: activeMembers.length,
      totalHadir: 0,
      kuorum: false,
      catatan: catatan ? `[Clone dari RAT Ulang] ${catatan}` : `[Clone dari RAT Ulang]`,
    });

    // Copy agenda from old RAT
    const oldAgenda = await db
      .select()
      .from(ratAgenda)
      .where(eq(ratAgenda.ratId, id));

    for (const a of oldAgenda) {
      await db.insert(ratAgenda).values({
        id: crypto.randomUUID(),
        ratId: newId,
        judul: a.judul,
        hasilVoting: null,
        suaraSetuju: 0,
        suaraTolak: 0,
        suaraDitunda: 0,
        catatan: null,
      });
    }

    return this.getById(newId);
  }

  // ── Hapus RAT draft ──
  async hapus(id: string) {
    const r = await db.select().from(rat).where(eq(rat.id, id)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    if (r.status !== "draft" && r.status !== "diperpanjang") {
      throw new HTTPException(400, { message: "Hanya RAT draft atau diperpanjang yang bisa dihapus" });
    }

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
    const content = await this.buildDocumentContent(tipe, r);

    await db.insert(ratDokumen).values({
      id: dokId,
      ratId: id,
      nama: namaMap[tipe] ?? `Dokumen ${tipe} ${r.periode}`,
      tipe: tipe as any,
      status: "final",
      content,
    });

    return { id: dokId, nama: namaMap[tipe], tipe, status: "final", content };
  }

  // ── Get single dokumen ──
  async getDokumen(ratId: string, dokId: string) {
    const r = await db.select().from(rat).where(eq(rat.id, ratId)).get();
    if (!r) throw new HTTPException(404, { message: "RAT tidak ditemukan" });

    const dok = await db
      .select()
      .from(ratDokumen)
      .where(and(eq(ratDokumen.id, dokId), eq(ratDokumen.ratId, ratId)))
      .get();

    if (!dok) throw new HTTPException(404, { message: "Dokumen tidak ditemukan" });

    return dok;
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

  // ── Document content builders ──
  private async buildDocumentContent(tipe: string, r: typeof rat.$inferSelect): Promise<string> {
    switch (tipe) {
      case "laporan_keuangan":
        return this.buildLaporanKeuanganContent(r);
      case "shu":
        return this.buildShuContent(r);
      case "lpj_pengurus":
        return this.buildLpjContent(r);
      case "laporan_pengawas":
        return this.buildPengawasContent(r);
      case "rencana_kerja":
        return this.buildRencanaKerjaContent(r);
      case "rapb":
        return this.buildRAPBContent(r);
      default:
        return `<p>Dokumen ${tipe} untuk periode ${r.periode}</p>`;
    }
  }

  private async buildLaporanKeuanganContent(r: typeof rat.$inferSelect): Promise<string> {
    const tanggalMulai = `${r.periode}-01-01`;
    const tanggalSelesai = `${r.periode}-12-31`;

    try {
      const neraca = await getNeraca();
      const labaRugi = await getLabaRugi({ tanggalMulai, tanggalSelesai });
      const arusKas = await getArusKas({ tanggalMulai, tanggalSelesai });

      const formatRupiah = (n: number) =>
        "Rp " + Math.abs(n).toLocaleString("id-ID");

      return `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
          <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Laporan Keuangan</h1>
          <p style="text-align:center;color:#666;">Periode Tahun Buku ${r.periode}<br/>${r.tempat}</p>

          <h2 style="color:#10b981;margin-top:32px;">Neraca</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Aset</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Jumlah</th></tr>
            ${neraca.aset.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.akun.kode} — ${a.akun.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.saldo)}</td></tr>`).join("")}
            <tr style="font-weight:bold;background:#f0fdf4;"><td style="padding:8px;border:1px solid #ddd;">Total Aset</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(neraca.totalAset)}</td></tr>
          </table>

          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Kewajiban & Ekuitas</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Jumlah</th></tr>
            ${neraca.kewajiban.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.akun.kode} — ${a.akun.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.saldo)}</td></tr>`).join("")}
            ${neraca.ekuitas.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.akun.kode} — ${a.akun.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.saldo)}</td></tr>`).join("")}
            <tr style="font-weight:bold;background:#f0fdf4;"><td style="padding:8px;border:1px solid #ddd;">Total Kewajiban & Ekuitas</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(neraca.totalLiabilitasEkuitas)}</td></tr>
          </table>

          <h2 style="color:#10b981;margin-top:32px;">Laba Rugi</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Pendapatan</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Jumlah</th></tr>
            ${labaRugi.pendapatan.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.akun.kode} — ${a.akun.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.total)}</td></tr>`).join("")}
            <tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Total Pendapatan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(labaRugi.totalPendapatan)}</td></tr>
            <tr style="background:#fef2f2;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Biaya</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Jumlah</th></tr>
            ${labaRugi.biaya.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.akun.kode} — ${a.akun.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.total)}</td></tr>`).join("")}
            <tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Total Biaya</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(labaRugi.totalBiaya)}</td></tr>
            <tr style="font-weight:bold;background:#f0fdf4;"><td style="padding:8px;border:1px solid #ddd;">${labaRugi.isProfit ? "Laba Bersih" : "Rugi Bersih"}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(labaRugi.labaRugi)}</td></tr>
          </table>

          <h2 style="color:#10b981;margin-top:32px;">Arus Kas</h2>
          <p>Saldo Awal: ${formatRupiah(arusKas.saldoAwal)}</p>
          <p>Saldo Akhir: ${formatRupiah(arusKas.saldoAkhir)}</p>
          <p>Net Cash Flow: ${formatRupiah(arusKas.netCashFlow)}</p>
        </div>
      `;
    } catch {
      return `<p>Laporan Keuangan ${r.periode} — Data keuangan belum tersedia lengkap.</p>`;
    }
  }

  private async buildShuContent(r: typeof rat.$inferSelect): Promise<string> {
    try {
      const shuData = await db.select().from(shu).where(eq(shu.periode, r.periode)).get();
      if (!shuData) {
        return `<p>Perhitungan SHU ${r.periode} — SHU belum dihitung untuk periode ini.</p>`;
      }

      const anggotaList = await db
        .select({
          nama: anggota.nama,
          noAnggota: anggota.noAnggota,
          jma: shuAnggota.jma,
          jua: shuAnggota.jua,
          total: shuAnggota.total,
          simpanan: shuAnggota.simpananAnggota,
          transaksi: shuAnggota.transaksiAnggota,
        })
        .from(shuAnggota)
        .innerJoin(anggota, eq(shuAnggota.anggotaId, anggota.id))
        .where(eq(shuAnggota.shuId, shuData.id))
        .orderBy(desc(anggota.nama));

      const formatRupiah = (n: string | number) =>
        "Rp " + Number(n).toLocaleString("id-ID");

      return `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
          <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Perhitungan Sisa Hasil Usaha (SHU)</h1>
          <p style="text-align:center;color:#666;">Periode Tahun Buku ${r.periode}</p>

          <h2 style="color:#10b981;margin-top:24px;">Ringkasan</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr><td style="padding:8px;border:1px solid #ddd;">Total Pendapatan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.totalPendapatan)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Total Biaya</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.totalBiaya)}</td></tr>
            <tr style="font-weight:bold;background:#f0fdf4;"><td style="padding:8px;border:1px solid #ddd;">Total SHU</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.totalShu)}</td></tr>
          </table>

          <h2 style="color:#10b981;margin-top:24px;">Alokasi SHU</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Komponen</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">%</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Jumlah</th></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Anggota (JMA + JUA)</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiAnggota}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaAnggota)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Cadangan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiCadangan}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaCadangan)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Pengurus</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiPengurus}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaPengurus)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Pendidikan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiPendidikan}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaPendidikan)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Sosial</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiSosial}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaSosial)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Dana Lainnya</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${shuData.alokasiLain}%</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(shuData.danaLain)}</td></tr>
          </table>

          <h2 style="color:#10b981;margin-top:24px;">Distribusi per Anggota</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">No. Anggota</th><th style="text-align:left;padding:8px;border:1px solid #ddd;">Nama</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">JMA</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">JUA</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Total</th></tr>
            ${anggotaList.map((a: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.noAnggota}</td><td style="padding:8px;border:1px solid #ddd;">${a.nama}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.jma)}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.jua)}</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(a.total)}</td></tr>`).join("")}
          </table>
        </div>
      `;
    } catch {
      return `<p>Perhitungan SHU ${r.periode} — Terjadi kesalahan saat memuat data.</p>`;
    }
  }

  private async buildLpjContent(r: typeof rat.$inferSelect): Promise<string> {
    try {
      const totalAnggota = await db.$count(anggota, eq(anggota.status, "aktif"));
      const totalSimpanan = db.all<{ total: string }>(sql`SELECT SUM(CAST(jumlah AS INTEGER)) as total FROM simpanan`);
      const totalPinjaman = db.all<{ total: string }>(sql`SELECT SUM(CAST(jumlah AS INTEGER)) as total FROM pinjaman WHERE status IN ('aktif','lunas')`);

      const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

      return `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
          <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Laporan Pertanggungjawaban Pengurus</h1>
          <p style="text-align:center;color:#666;">Periode Tahun Buku ${r.periode}<br/>${r.tempat}</p>

          <h2 style="color:#10b981;margin-top:24px;">Ringkasan Koperasi</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <tr><td style="padding:8px;border:1px solid #ddd;">Jumlah Anggota Aktif</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${totalAnggota} orang</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Total Simpanan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(Number(totalSimpanan[0]?.total ?? 0))}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;">Total Pinjaman Aktif/Lunas</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">${formatRupiah(Number(totalPinjaman[0]?.total ?? 0))}</td></tr>
          </table>

          <h2 style="color:#10b981;margin-top:24px;">Pencapaian Tahun ${r.periode}</h2>
          <ul>
            <li>Pengelolaan simpanan dan pinjaman berjalan sesuai ketentuan AD/ART.</li>
            <li>Laporan keuangan telah diaudit dan disampaikan kepada anggota.</li>
            <li>Pengurus aktif melaksanakan program kerja yang telah ditetapkan.</li>
          </ul>

          <h2 style="color:#10b981;margin-top:24px;">Rencana Kerja Mendatang</h2>
          <ul>
            <li>Meningkatkan partisipasi simpanan sukarela anggota.</li>
            <li>Memperluas layanan pinjaman dengan tetap menjaga kolektibilitas.</li>
            <li>Melaksanakan program pendidikan dan pelatihan bagi anggota.</li>
          </ul>
        </div>
      `;
    } catch {
      return `<p>LPJ Pengurus ${r.periode}</p>`;
    }
  }

  private buildPengawasContent(r: typeof rat.$inferSelect): string {
    return `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
        <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Laporan Pengawas</h1>
        <p style="text-align:center;color:#666;">Periode Tahun Buku ${r.periode}<br/>${r.tempat}</p>

        <h2 style="color:#10b981;margin-top:24px;">Hasil Pengawasan</h2>
        <p>Pengawas telah melakukan pengawasan terhadap pengelolaan koperasi selama periode ${r.periode} dan menyimpulkan:</p>
        <ol>
          <li>Pengurus telah menjalankan tugas sesuai dengan AD/ART dan ketentuan yang berlaku.</li>
          <li>Laporan keuangan telah disusun sesuai dengan prinsip akuntansi yang berterima umum.</li>
          <li>Tidak ditemukan penyimpangan yang signifikan dalam pengelolaan aset koperasi.</li>
          <li>SHU telah dihitung dan dialokasikan sesuai dengan kesepakatan Rapat Anggota.</li>
        </ol>

        <h2 style="color:#10b981;margin-top:24px;">Rekomendasi</h2>
        <ul>
          <li>Pengurus diharapkan terus meningkatkan transparansi dalam pengelolaan keuangan.</li>
          <li>Anggota dihimbau untuk aktif berpartisipasi dalam kegiatan koperasi.</li>
        </ul>

        <p style="margin-top:32px;"><em>Dibuat oleh Pengawas Koperasi</em></p>
      </div>
    `;
  }

  private buildRencanaKerjaContent(r: typeof rat.$inferSelect): string {
    return `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
        <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Rencana Kerja Tahun ${Number(r.periode) + 1}</h1>
        <p style="text-align:center;color:#666;">Disusun dalam RAT Tahun Buku ${r.periode}</p>

        <h2 style="color:#10b981;margin-top:24px;">1. Visi dan Misi</h2>
        <p>Mewujudkan koperasi yang sehat, mandiri, dan berdaya saing untuk meningkatkan kesejahteraan anggota.</p>

        <h2 style="color:#10b981;margin-top:24px;">2. Program Strategis</h2>
        <ul>
          <li><strong>Pengembangan Usaha:</strong> Memperluas layanan simpan pinjam dan menambah jenis produk/layanan baru.</li>
          <li><strong>Peningkatan Modal:</strong> Menggalang simpanan sukarela dan mengeksplorasi sumber pendanaan alternatif.</li>
          <li><strong>Pemberdayaan Anggota:</strong> Mengadakan pelatihan kewirausahaan dan manajemen keuangan.</li>
          <li><strong>Teknologi Informasi:</strong> Melanjutkan digitalisasi sistem administrasi dan layanan online.</li>
        </ul>

        <h2 style="color:#10b981;margin-top:24px;">3. Target Operasional</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Indikator</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Target</th></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Pertumbuhan Anggota</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">10%</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Pertumbuhan Simpanan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">15%</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Kolektibilitas Pinjaman</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">> 95% Lancar</td></tr>
        </table>
      </div>
    `;
  }

  private buildRAPBContent(r: typeof rat.$inferSelect): string {
    return `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
        <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Rencana Anggaran Pendapatan dan Biaya (RAPB)</h1>
        <p style="text-align:center;color:#666;">Tahun ${Number(r.periode) + 1}<br/>Disusun dalam RAT Tahun Buku ${r.periode}</p>

        <h2 style="color:#10b981;margin-top:24px;">1. Anggaran Pendapatan</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr style="background:#f0fdf4;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Sumber Pendapatan</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Anggaran</th></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Pendapatan Bunga Pinjaman</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Pendapatan Administrasi</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Pendapatan Lain-lain</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Total Pendapatan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
        </table>

        <h2 style="color:#10b981;margin-top:24px;">2. Anggaran Biaya</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr style="background:#fef2f2;"><th style="text-align:left;padding:8px;border:1px solid #ddd;">Jenis Biaya</th><th style="text-align:right;padding:8px;border:1px solid #ddd;">Anggaran</th></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Biaya Operasional</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Biaya Personel</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Biaya Pemasaran</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Biaya Pendidikan & Pelatihan</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
          <tr style="font-weight:bold;"><td style="padding:8px;border:1px solid #ddd;">Total Biaya</td><td style="text-align:right;padding:8px;border:1px solid #ddd;">Rp 0</td></tr>
        </table>

        <p style="margin-top:24px;"><em>* Anggaran ini merupakan draft awal yang akan disesuaikan berdasarkan realisasi dan kebijakan pengurus.</em></p>
      </div>
    `;
  }

  private buildNotulensiContent(r: typeof rat.$inferSelect, agendaList: any[]): string {
    const rows = agendaList
      .map((a, i) => {
        const voteInfo = a.suaraSetuju + a.suaraTolak + a.suaraDitunda > 0
          ? `<br/><small>Suara: ${a.suaraSetuju} setuju, ${a.suaraTolak} menolak, ${a.suaraDitunda} ditunda</small>`
          : "";
        const catatan = a.catatan ? `<br/><small>Catatan: ${a.catatan}</small>` : "";
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;">${a.judul}</td>
          <td style="padding:8px;border:1px solid #ddd;">${a.hasilVoting ?? "Belum diputuskan"}${voteInfo}${catatan}</td>
        </tr>`;
      })
      .join("");

    return `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:24px;">
        <h1 style="text-align:center;border-bottom:2px solid #10b981;padding-bottom:12px;">Notulensi Rapat Anggota Tahunan</h1>
        <p style="text-align:center;color:#666;">Periode Tahun Buku ${r.periode}</p>

        <table style="width:100%;margin-top:24px;">
          <tr><td style="padding:4px 0;"><strong>Tanggal:</strong></td><td>${r.tanggalRAT}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Tempat:</strong></td><td>${r.tempat}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Hadir:</strong></td><td>${r.totalHadir} dari ${r.totalAnggota} anggota</td></tr>
          <tr><td style="padding:4px 0;"><strong>Kuorum:</strong></td><td>${r.kuorum ? "Terpenuhi" : "Tidak terpenuhi"}</td></tr>
        </table>

        <h2 style="color:#10b981;margin-top:32px;">Agenda dan Hasil Voting</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr style="background:#f0fdf4;">
            <th style="text-align:left;padding:8px;border:1px solid #ddd;width:40px;">No</th>
            <th style="text-align:left;padding:8px;border:1px solid #ddd;">Agenda</th>
            <th style="text-align:left;padding:8px;border:1px solid #ddd;">Hasil</th>
          </tr>
          ${rows}
        </table>

        <p style="margin-top:32px;"><em>Notulensi ini dibuat secara otomatis dari sistem.</em></p>
      </div>
    `;
  }
}

export const ratService = new RatService();
