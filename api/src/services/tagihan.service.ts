import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { tagihanSimpanan, anggota } from "../../database/schema/index.js";

export class TagihanService {
  async list({ periode, status, page = 1, limit = 20 }: { periode?: string; status?: string; page?: number; limit?: number }) {
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (periode) conditions.push(eq(tagihanSimpanan.periode, periode));
    if (status) conditions.push(eq(tagihanSimpanan.status, status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        tagihanSimpanan: tagihanSimpanan,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(tagihanSimpanan)
      .leftJoin(anggota, eq(tagihanSimpanan.anggotaId, anggota.id))
      .where(where)
      .orderBy(desc(tagihanSimpanan.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(tagihanSimpanan, where);

    const result = data.map((row) => ({
      ...row.tagihanSimpanan,
      anggota: row.anggotaNama ? { nama: row.anggotaNama, noAnggota: row.anggotaNo } : null,
    }));

    return { data: result, meta: { page, limit, total } };
  }

  async generateTagihan({ periode, jumlah }: { periode: string; jumlah: string }) {
    // Get all active anggota
    const members = await db.select().from(anggota).where(eq(anggota.status, "aktif"));

    let created = 0;
    let skipped = 0;

    if (members.length === 0) {
      return { created, skipped, periode };
    }

    // Get all existing tagihan for this period in one query
    const existing = await db
      .select({ anggotaId: tagihanSimpanan.anggotaId })
      .from(tagihanSimpanan)
      .where(eq(tagihanSimpanan.periode, periode));

    const existingAnggotaIds = new Set(existing.map((e) => e.anggotaId));

    const toInsert = [];
    for (const m of members) {
      if (existingAnggotaIds.has(m.id)) {
        skipped++;
        continue;
      }

      toInsert.push({
        id: crypto.randomUUID(),
        anggotaId: m.id,
        periode,
        jenis: "wajib",
        jumlah,
        status: "belum_bayar",
      });
      created++;
    }

    if (toInsert.length > 0) {
      await db.insert(tagihanSimpanan).values(toInsert);
    }

    return { created, skipped, periode };
  }

  async bayarTagihan({ tagihanId, tanggalBayar }: { tagihanId: string; tanggalBayar: string }) {
    await db
      .update(tagihanSimpanan)
      .set({ status: "lunas", tanggalBayar })
      .where(eq(tagihanSimpanan.id, tagihanId));
    return { id: tagihanId, status: "lunas" };
  }

  async cekTunggakan() {
    const today = new Date().toISOString().split("T")[0];
    const periodeSekarang = today.slice(0, 7); // YYYY-MM

    // Mark all belum_bayar from previous periode as tunggakan
    const result = await db
      .update(tagihanSimpanan)
      .set({ status: "tunggakan" })
      .where(and(eq(tagihanSimpanan.status, "belum_bayar"), sql`${tagihanSimpanan.periode} < ${periodeSekarang}`));

    return { updated: result.changes ?? 0 };
  }

  async getSummary(periode?: string) {
    const targetPeriode = periode || new Date().toISOString().split("T")[0].slice(0, 7);

    const rows = await db
      .select({
        status: tagihanSimpanan.status,
        count: sql<number>`COUNT(*)`,
        total: sql<number>`SUM(CAST(${tagihanSimpanan.jumlah} AS INTEGER))`,
      })
      .from(tagihanSimpanan)
      .where(eq(tagihanSimpanan.periode, targetPeriode))
      .groupBy(tagihanSimpanan.status);

    const summary = {
      belum_bayar: 0,
      lunas: 0,
      tunggakan: 0,
      totalBelumBayar: 0,
      totalLunas: 0,
      totalTunggakan: 0,
    };

    for (const r of rows) {
      if (r.status === "belum_bayar") {
        summary.belum_bayar = r.count;
        summary.totalBelumBayar = r.total ?? 0;
      } else if (r.status === "lunas") {
        summary.lunas = r.count;
        summary.totalLunas = r.total ?? 0;
      } else if (r.status === "tunggakan") {
        summary.tunggakan = r.count;
        summary.totalTunggakan = r.total ?? 0;
      }
    }

    return { ...summary, periode: targetPeriode };
  }
}

export const tagihanService = new TagihanService();
