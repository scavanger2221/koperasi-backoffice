import { eq, desc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { shu, shuAnggota, anggota, simpanan, pinjaman } from "../../database/schema/index.js";
import { getLabaRugi } from "./jurnal.service.js";

export class ShuService {
  async list() {
    const data = await db
      .select()
      .from(shu)
      .orderBy(desc(shu.periode));

    return { data };
  }

  async getById(id: string) {
    const s = await db.select().from(shu).where(eq(shu.id, id)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });

    const anggotaList = await db
      .select({
        id: shuAnggota.id,
        shuId: shuAnggota.shuId,
        anggotaId: shuAnggota.anggotaId,
        jma: shuAnggota.jma,
        jua: shuAnggota.jua,
        total: shuAnggota.total,
        simpananAnggota: shuAnggota.simpananAnggota,
        transaksiAnggota: shuAnggota.transaksiAnggota,
        status: shuAnggota.status,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(shuAnggota)
      .innerJoin(anggota, eq(shuAnggota.anggotaId, anggota.id))
      .where(eq(shuAnggota.shuId, id))
      .orderBy(desc(anggota.nama));

    return {
      ...s,
      anggotaList: anggotaList.map((a) => ({
        id: a.id,
        shuId: a.shuId,
        anggotaId: a.anggotaId,
        jma: a.jma,
        jua: a.jua,
        total: a.total,
        simpananAnggota: a.simpananAnggota,
        transaksiAnggota: a.transaksiAnggota,
        status: a.status,
        anggota: { nama: a.anggotaNama, noAnggota: a.anggotaNo },
      })),
    };
  }

  async hitung(periode: string) {
    // Check if SHU already exists for this periode
    const existing = await db.select().from(shu).where(eq(shu.periode, periode)).get();
    if (existing) {
      throw new HTTPException(400, {
        message: `SHU periode ${periode} sudah ada. Hapus yang existing dulu untuk menghitung ulang.`,
      });
    }

    // Step 1: Get laba rugi for the period
    const tanggalMulai = `${periode}-01-01`;
    const tanggalSelesai = `${periode}-12-31`;

    const labaRugi = await getLabaRugi({ tanggalMulai, tanggalSelesai });
    const totalSHU = labaRugi.labaRugi;

    if (totalSHU <= 0) {
      throw new HTTPException(400, {
        message: `Tidak ada SHU untuk periode ${periode} (laba bersih: ${totalSHU}). SHU hanya bisa dihitung jika ada laba positif.`,
      });
    }

    // Step 2: Get default allocation percentages
    const alokasi = {
      anggota: 40,
      cadangan: 20,
      pengurus: 10,
      pendidikan: 5,
      sosial: 5,
      lain: 20,
    };

    // Step 3: Calculate allocation amounts
    const danaAnggota = Math.floor(totalSHU * alokasi.anggota / 100);
    const danaCadangan = Math.floor(totalSHU * alokasi.cadangan / 100);
    const danaPengurus = Math.floor(totalSHU * alokasi.pengurus / 100);
    const danaPendidikan = Math.floor(totalSHU * alokasi.pendidikan / 100);
    const danaSosial = Math.floor(totalSHU * alokasi.sosial / 100);
    const danaLain = Math.floor(totalSHU * alokasi.lain / 100);

    // Step 4: Calculate per-anggota
    const activeMembers = await db
      .select()
      .from(anggota)
      .where(eq(anggota.status, "aktif"));

    if (activeMembers.length === 0) {
      throw new HTTPException(400, { message: "Tidak ada anggota aktif" });
    }

    // Get total simpanan for all active members
    let totalSimpananAll = 0;
    const simpananPerAnggota: Record<string, number> = {};

    for (const member of activeMembers) {
      const rows = db.all<{ total: string }>(sql`
        SELECT SUM(CAST(jumlah AS INTEGER)) as total
        FROM simpanan
        WHERE anggota_id = ${member.id}
      `);
      const total = Number(rows[0]?.total ?? 0);
      simpananPerAnggota[member.id] = total;
      totalSimpananAll += total;
    }

    // Get total transaksi (pinjaman + angsuran) for each member
    let totalTransaksiAll = 0;
    const transaksiPerAnggota: Record<string, number> = {};

    for (const member of activeMembers) {
      const rows = db.all<{ total: string }>(sql`
        SELECT SUM(CAST(jumlah AS INTEGER)) as total
        FROM pinjaman
        WHERE anggota_id = ${member.id}
          AND status IN ('aktif', 'lunas', 'macet')
      `);
      const total = Number(rows[0]?.total ?? 0);
      transaksiPerAnggota[member.id] = total;
      totalTransaksiAll += total;
    }

    // Step 5: Create SHU record
    const id = crypto.randomUUID();

    // JMA = 50% of danaAnggota, distributed proportionally by simpanan
    // JUA = 50% of danaAnggota, distributed proportionally by transaksi
    const jmaPool = Math.floor(danaAnggota / 2);
    const juaPool = danaAnggota - jmaPool; // handle odd numbers

    await db.insert(shu).values({
      id,
      periode,
      totalShu: String(totalSHU),
      totalPendapatan: String(labaRugi.totalPendapatan),
      totalBiaya: String(labaRugi.totalBiaya),
      alokasiAnggota: String(alokasi.anggota),
      alokasiCadangan: String(alokasi.cadangan),
      alokasiPengurus: String(alokasi.pengurus),
      alokasiPendidikan: String(alokasi.pendidikan),
      alokasiSosial: String(alokasi.sosial),
      alokasiLain: String(alokasi.lain),
      danaAnggota: String(danaAnggota),
      danaCadangan: String(danaCadangan),
      danaPengurus: String(danaPengurus),
      danaPendidikan: String(danaPendidikan),
      danaSosial: String(danaSosial),
      danaLain: String(danaLain),
      totalSimpanan: String(totalSimpananAll),
      totalTransaksi: String(totalTransaksiAll),
      status: "draft",
    });

    // Step 6: Create per-anggota records
    for (const member of activeMembers) {
      const simpananAnggota = simpananPerAnggota[member.id] || 0;
      const transaksiAnggota = transaksiPerAnggota[member.id] || 0;

      let jma = 0;
      if (totalSimpananAll > 0) {
        jma = Math.floor((simpananAnggota / totalSimpananAll) * jmaPool);
      }

      let jua = 0;
      if (totalTransaksiAll > 0) {
        jua = Math.floor((transaksiAnggota / totalTransaksiAll) * juaPool);
      }

      const total = jma + jua;

      await db.insert(shuAnggota).values({
        id: crypto.randomUUID(),
        shuId: id,
        anggotaId: member.id,
        jma: String(jma),
        jua: String(jua),
        total: String(total),
        simpananAnggota: String(simpananAnggota),
        transaksiAnggota: String(transaksiAnggota),
        status: "belum_dibagikan",
      });
    }

    return { id, periode, totalSHU, jumlahAnggota: activeMembers.length };
  }

  async konfirmasi(id: string) {
    const s = await db.select().from(shu).where(eq(shu.id, id)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });
    if (s.status !== "draft") throw new HTTPException(400, { message: "Hanya SHU draft yang bisa dikonfirmasi" });

    await db.update(shu).set({ status: "dikonfirmasi" }).where(eq(shu.id, id));
    return { id, status: "dikonfirmasi" };
  }

  async sahkan(id: string) {
    const s = await db.select().from(shu).where(eq(shu.id, id)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });
    if (s.status !== "dikonfirmasi") throw new HTTPException(400, { message: "Hanya SHU dikonfirmasi yang bisa disahkan" });

    await db.update(shu).set({ status: "disahkan" }).where(eq(shu.id, id));
    return { id, status: "disahkan" };
  }

  async bagikan(id: string) {
    const s = await db.select().from(shu).where(eq(shu.id, id)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });
    if (s.status !== "disahkan") throw new HTTPException(400, { message: "Hanya SHU disahkan yang bisa dibagikan" });

    await db.update(shu).set({ status: "dibagikan" }).where(eq(shu.id, id));
    await db
      .update(shuAnggota)
      .set({ status: "dibagikan" })
      .where(eq(shuAnggota.shuId, id));

    return { id, status: "dibagikan" };
  }

  async hapus(id: string) {
    const s = await db.select().from(shu).where(eq(shu.id, id)).get();
    if (!s) throw new HTTPException(404, { message: "SHU tidak ditemukan" });
    if (s.status !== "draft") throw new HTTPException(400, { message: "Hanya SHU draft yang bisa dihapus" });

    await db.delete(shuAnggota).where(eq(shuAnggota.shuId, id));
    await db.delete(shu).where(eq(shu.id, id));
    return { id, deleted: true };
  }
}

export const shuService = new ShuService();
