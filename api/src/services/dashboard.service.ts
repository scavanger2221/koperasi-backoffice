import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import { anggota, simpanan, pinjaman, angsuran } from "../../database/schema/index.js";

export class DashboardService {
  async ringkasan() {
    const totalAnggota = await db.$count(anggota, eq(anggota.status, "aktif"));
    const totalPinjamanAktif = await db.$count(pinjaman, eq(pinjaman.status, "aktif"));

    const simpananRows = await db.select().from(simpanan);
    let totalSimpanan = 0;
    for (const s of simpananRows) totalSimpanan += Number(s.jumlah);

    const pinjamanRows = await db.select().from(pinjaman).where(eq(pinjaman.status, "aktif"));
    let totalPinjaman = 0;
    for (const p of pinjamanRows) totalPinjaman += Number(p.jumlah);

    const angsuranRows = await db
      .select()
      .from(angsuran)
      .where(eq(angsuran.status, "belum_lunas"));
    let totalTunggakan = 0;
    for (const a of angsuranRows) totalTunggakan += Number(a.totalBayar);

    return {
      totalAnggota,
      totalSimpanan,
      totalPinjamanAktif,
      totalPinjaman,
      totalTunggakan,
      jumlahAngsuranTunggakan: angsuranRows.length,
    };
  }

  async aktivitasTerakhir() {
    const recentAnggota = await db
      .select()
      .from(anggota)
      .orderBy(sql`${anggota.createdAt} desc`)
      .limit(5);

    const recentSimpanan = await db
      .select()
      .from(simpanan)
      .orderBy(sql`${simpanan.createdAt} desc`)
      .limit(5);

    const recentPinjaman = await db
      .select()
      .from(pinjaman)
      .orderBy(sql`${pinjaman.createdAt} desc`)
      .limit(5);

    return {
      anggotaBaru: recentAnggota,
      simpananBaru: recentSimpanan,
      pinjamanBaru: recentPinjaman,
    };
  }
}

export const dashboardService = new DashboardService();
