import { eq, sql, desc } from "drizzle-orm";
import { db } from "../lib/db.js";
import { anggota, simpanan, pinjaman, angsuran } from "../../database/schema/index.js";

export class DashboardService {
  async ringkasan() {
    const totalAnggota = await db.$count(anggota, eq(anggota.status, "aktif"));
    const totalPinjamanAktif = await db.$count(pinjaman, eq(pinjaman.status, "aktif"));

    const [simpananSum] = await db
      .select({
        total: sql<string>`SUM(CAST(${simpanan.jumlah} AS REAL))`,
      })
      .from(simpanan);
    const totalSimpanan = Number(simpananSum?.total ?? 0);

    const [pinjamanSum] = await db
      .select({
        total: sql<string>`SUM(CAST(${pinjaman.jumlah} AS REAL))`,
      })
      .from(pinjaman)
      .where(eq(pinjaman.status, "aktif"));
    const totalPinjaman = Number(pinjamanSum?.total ?? 0);

    const [angsuranSum] = await db
      .select({
        total: sql<string>`SUM(CAST(${angsuran.totalBayar} AS REAL))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(angsuran)
      .where(eq(angsuran.status, "belum_lunas"));
    const totalTunggakan = Number(angsuranSum?.total ?? 0);
    const jumlahAngsuranTunggakan = Number(angsuranSum?.count ?? 0);

    return {
      totalAnggota,
      totalSimpanan,
      totalPinjamanAktif,
      totalPinjaman,
      totalTunggakan,
      jumlahAngsuranTunggakan,
    };
  }

  async simpananPerBulan() {
    const rows = await db
      .select({
        bulan: sql<string>`strftime('%Y-%m', ${simpanan.tanggal})`,
        total: sql<number>`SUM(CAST(${simpanan.jumlah} AS INTEGER))`,
      })
      .from(simpanan)
      .groupBy(sql`strftime('%Y-%m', ${simpanan.tanggal})`)
      .orderBy(sql`strftime('%Y-%m', ${simpanan.tanggal})`)
      .limit(12);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return rows.map((r) => {
      const [year, month] = r.bulan.split("-");
      return {
        label: `${monthNames[Number(month) - 1]} ${year}`,
        month: monthNames[Number(month) - 1],
        year,
        total: r.total,
        totalJuta: Math.round(r.total / 1_000_000 * 10) / 10,
      };
    });
  }

  async pinjamanStatusCounts() {
    const rows = await db
      .select({
        status: pinjaman.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(pinjaman)
      .groupBy(pinjaman.status);

    const map: Record<string, number> = {};
    for (const r of rows) map[r.status] = r.count;

    return {
      diajukan: map.diajukan ?? 0,
      disetujui: map.disetujui ?? 0,
      aktif: map.aktif ?? 0,
      lunas: map.lunas ?? 0,
      ditolak: map.ditolak ?? 0,
      macet: map.macet ?? 0,
      total: Object.values(map).reduce((a, b) => a + b, 0),
    };
  }

  async aktivitasTerakhir() {
    const recentAnggota = await db
      .select()
      .from(anggota)
      .orderBy(desc(anggota.createdAt))
      .limit(5);

    const recentSimpanan = await db
      .select({
        id: simpanan.id,
        anggotaId: simpanan.anggotaId,
        jenis: simpanan.jenis,
        jumlah: simpanan.jumlah,
        tanggal: simpanan.tanggal,
        metodeBayar: simpanan.metodeBayar,
        keterangan: simpanan.keterangan,
        createdAt: simpanan.createdAt,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(simpanan)
      .leftJoin(anggota, eq(simpanan.anggotaId, anggota.id))
      .orderBy(desc(simpanan.createdAt))
      .limit(5);

    const recentPinjaman = await db
      .select({
        id: pinjaman.id,
        anggotaId: pinjaman.anggotaId,
        noPinjaman: pinjaman.noPinjaman,
        jumlah: pinjaman.jumlah,
        bungaPersen: pinjaman.bungaPersen,
        jangkaWaktu: pinjaman.jangkaWaktu,
        status: pinjaman.status,
        tanggalPengajuan: pinjaman.tanggalPengajuan,
        createdAt: pinjaman.createdAt,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(pinjaman)
      .leftJoin(anggota, eq(pinjaman.anggotaId, anggota.id))
      .orderBy(desc(pinjaman.createdAt))
      .limit(5);

    return {
      anggotaBaru: recentAnggota,
      simpananBaru: recentSimpanan.map((s) => ({
        ...s,
        anggota: s.anggotaNama ? { nama: s.anggotaNama, noAnggota: s.anggotaNo } : null,
      })),
      pinjamanBaru: recentPinjaman.map((p) => ({
        ...p,
        anggota: p.anggotaNama ? { nama: p.anggotaNama, noAnggota: p.anggotaNo } : null,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
