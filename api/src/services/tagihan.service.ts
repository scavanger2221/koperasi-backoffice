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
      .select()
      .from(tagihanSimpanan)
      .where(where)
      .orderBy(desc(tagihanSimpanan.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(tagihanSimpanan, where);

    const result = [];
    for (const t of data) {
      const a = await db.select().from(anggota).where(eq(anggota.id, t.anggotaId)).get();
      result.push({ ...t, anggota: a ? { nama: a.nama, noAnggota: a.noAnggota } : null });
    }

    return { data: result, meta: { page, limit, total } };
  }

  async generateTagihan({ periode, jumlah }: { periode: string; jumlah: string }) {
    // Get all active anggota
    const members = await db.select().from(anggota).where(eq(anggota.status, "aktif"));

    let created = 0;
    let skipped = 0;

    for (const m of members) {
      // Check if already exists for this periode
      const existing = await db
        .select()
        .from(tagihanSimpanan)
        .where(and(eq(tagihanSimpanan.anggotaId, m.id), eq(tagihanSimpanan.periode, periode)))
        .get();

      if (existing) {
        skipped++;
        continue;
      }

      await db.insert(tagihanSimpanan).values({
        id: crypto.randomUUID(),
        anggotaId: m.id,
        periode,
        jenis: "wajib",
        jumlah,
        status: "belum_bayar",
      });
      created++;
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
