import { eq, and, desc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db, rawSqlite } from "../lib/db.js";
import { pinjaman, angsuran, anggota } from "../../database/schema/index.js";
import { jurnalPinjamanCair, jurnalAngsuran } from "./jurnal.service.js";
import type { PinjamanInput, AngsuranInput } from "@koperasi/shared/schemas";

export class PinjamanService {
  async list({ anggotaId, status, page = 1, limit = 20 }: { anggotaId?: string; status?: string; page?: number; limit?: number }) {
    const offset = (page - 1) * limit;

    let conditions = undefined;
    if (anggotaId) conditions = eq(pinjaman.anggotaId, anggotaId);
    if (status) {
      const statusCond = eq(pinjaman.status, status as any);
      conditions = conditions ? and(conditions, statusCond) : statusCond;
    }

    const data = await db
      .select({
        pinjaman: pinjaman,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(pinjaman)
      .leftJoin(anggota, eq(pinjaman.anggotaId, anggota.id))
      .where(conditions)
      .orderBy(desc(pinjaman.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(pinjaman, conditions);

    const result = data.map((row) => ({
      ...row.pinjaman,
      anggota: row.anggotaNama ? { nama: row.anggotaNama, noAnggota: row.anggotaNo } : null,
    }));

    return { data: result, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const p = await db.select().from(pinjaman).where(eq(pinjaman.id, id)).get();
    if (!p) throw new HTTPException(404, { message: "Pinjaman tidak ditemukan" });

    const angs = await db.select().from(angsuran).where(eq(angsuran.pinjamanId, id)).orderBy(angsuran.angsuranKe);
    const a = await db.select().from(anggota).where(eq(anggota.id, p.anggotaId)).get();

    return { ...p, angsuran: angs, anggota: a ? { nama: a.nama, noAnggota: a.noAnggota } : null };
  }

  async ajukan(data: PinjamanInput) {
    const member = await db.select().from(anggota).where(eq(anggota.id, data.anggotaId)).get();
    if (!member) throw new HTTPException(404, { message: "Anggota tidak ditemukan" });
    if (member.status !== "aktif") throw new HTTPException(400, { message: "Anggota tidak aktif" });

    const jumlah = Number(data.jumlah);
    const bungaBulan = Number(data.bungaPersen) / 100 / 12;
    const tenor = data.jangkaWaktu;

    // Flat bunga for MVP
    const pokokBulan = Math.floor(jumlah / tenor);
    const bungaBulanNominal = Math.floor(jumlah * bungaBulan);
    const angsuranPerBulan = pokokBulan + bungaBulanNominal;

    const id = crypto.randomUUID();
    const noPinjaman = `PJ${Date.now()}`;

    await db.insert(pinjaman).values({
      id,
      anggotaId: data.anggotaId,
      noPinjaman,
      jumlah: data.jumlah,
      bungaPersen: data.bungaPersen,
      jenisBunga: data.jenisBunga,
      jangkaWaktu: tenor,
      angsuranPerBulan: String(angsuranPerBulan),
      status: "diajukan",
      keterangan: data.keterangan,
    });

    return { id, noPinjaman };
  }

  async approve(id: string) {
    const p = await db.select().from(pinjaman).where(eq(pinjaman.id, id)).get();
    if (!p) throw new HTTPException(404, { message: "Pinjaman tidak ditemukan" });
    if (p.status !== "diajukan") throw new HTTPException(400, { message: "Status pinjaman tidak valid untuk approve" });

    await db
      .update(pinjaman)
      .set({ status: "disetujui", tanggalAcc: new Date().toISOString().split("T")[0] })
      .where(eq(pinjaman.id, id));

    return { id, status: "disetujui" };
  }

  async cairkan(id: string) {
    const p = await db.select().from(pinjaman).where(eq(pinjaman.id, id)).get();
    if (!p) throw new HTTPException(404, { message: "Pinjaman tidak ditemukan" });
    if (p.status !== "disetujui") throw new HTTPException(400, { message: "Pinjaman belum disetujui" });

    const member = await db.select().from(anggota).where(eq(anggota.id, p.anggotaId)).get();
    const tanggalCair = new Date().toISOString().split("T")[0];
    await db
      .update(pinjaman)
      .set({ status: "aktif", tanggalPencairan: tanggalCair })
      .where(eq(pinjaman.id, id));

    // Auto-create jurnal pencairan
    await jurnalPinjamanCair({
      pinjamanId: id,
      anggotaNama: member?.nama || "-",
      jumlah: Number(p.jumlah),
      tanggal: tanggalCair,
    });

    // Generate angsuran schedule (flat bunga)
    const jumlah = Number(p.jumlah);
    const tenor = p.jangkaWaktu;
    const bungaBulan = Number(p.bungaPersen) / 100 / 12;
    const pokokBulan = Math.floor(jumlah / tenor);
    const bungaBulanNominal = Math.floor(jumlah * bungaBulan);

    const baseDate = new Date();
    for (let i = 1; i <= tenor; i++) {
      const due = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      await db.insert(angsuran).values({
        id: crypto.randomUUID(),
        pinjamanId: id,
        angsuranKe: i,
        tanggalJatuhTempo: due.toISOString().split("T")[0],
        jumlahPokok: String(pokokBulan),
        jumlahBunga: String(bungaBulanNominal),
        denda: "0",
        totalBayar: String(pokokBulan + bungaBulanNominal),
        status: "belum_lunas",
      });
    }

    return { id, status: "aktif" };
  }

  async getDenda(tanggalJatuhTempo: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(tanggalJatuhTempo);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 0;
    // Denda 0.5% per bulan dari sisa angsuran
    return Math.floor(diffDays * 0.5 / 30);
  }

  async getKolektibilitas(pinjamanId: string): Promise<number> {
    const result = db.get<{ maxTelat: number }>(sql`
      SELECT MAX(
        CASE
          WHEN status = 'belum_lunas' THEN CAST(julianday('now') - julianday(tanggal_jatuh_tempo) AS INTEGER)
          WHEN status IN ('lunas', 'telat') AND tanggal_bayar IS NOT NULL
            THEN CAST(julianday(tanggal_bayar) - julianday(tanggal_jatuh_tempo) AS INTEGER)
          ELSE 0
        END
      ) as maxTelat
      FROM angsuran
      WHERE pinjaman_id = ${pinjamanId}
    `);

    const maxTelat = result?.maxTelat ?? 0;
    if (maxTelat <= 0) return 1;
    if (maxTelat <= 90) return 2;
    if (maxTelat <= 180) return 3;
    return 4;
  }

  async getKolektibilitasMap(activePinjaman: typeof pinjaman.$inferSelect[]) {
    if (activePinjaman.length === 0) return {};
    const pinjamanIds = activePinjaman.map((p) => p.id);

    const results = db.all<{ pinjamanId: string; maxTelat: number }>(sql`
      SELECT pinjaman_id as pinjamanId,
        MAX(
          CASE
            WHEN status = 'belum_lunas' THEN CAST(julianday('now') - julianday(tanggal_jatuh_tempo) AS INTEGER)
            WHEN status IN ('lunas', 'telat') AND tanggal_bayar IS NOT NULL
              THEN CAST(julianday(tanggal_bayar) - julianday(tanggal_jatuh_tempo) AS INTEGER)
            ELSE 0
          END
        ) as maxTelat
      FROM angsuran
      WHERE pinjaman_id IN (${sql.join(pinjamanIds.map(id => sql`${id}`))})
      GROUP BY pinjaman_id
    `);

    const kolMap: Record<string, number> = {};
    for (const r of results) {
      const mt = r.maxTelat;
      let kol = 1;
      if (mt > 180) kol = 4;
      else if (mt > 90) kol = 3;
      else if (mt > 0) kol = 2;
      kolMap[r.pinjamanId] = kol;
    }

    return kolMap;
  }

  async cekDanUpdateDenda() {
    const today = new Date().toISOString().split("T")[0];

    // Batch update all overdue angsuran to telat with denda
    const result = rawSqlite.prepare(`
      UPDATE angsuran SET
        status = 'telat',
        denda = CAST(
          CAST(julianday(?) - julianday(tanggal_jatuh_tempo) AS INTEGER) * 0.5 / 30 AS INTEGER
        ),
        total_bayar = CAST(
          CAST(jumlah_pokok AS INTEGER) + CAST(jumlah_bunga AS INTEGER) +
          CAST(
            CAST(julianday(?) - julianday(tanggal_jatuh_tempo) AS INTEGER) * 0.5 / 30 AS INTEGER
          ) AS TEXT
        )
      WHERE status = 'belum_lunas' AND tanggal_jatuh_tempo < ?
    `).run(today, today, today);

    const changed = result.changes;

    // Mark pinjaman as macet if kolektibilitas >= 4
    const activePinjaman = await db.select().from(pinjaman).where(eq(pinjaman.status, "aktif"));
    if (activePinjaman.length > 0) {
      const kolMap = await this.getKolektibilitasMap(activePinjaman);
      const macetIds = Object.entries(kolMap).filter(([, kol]) => kol >= 4).map(([id]) => id);
      if (macetIds.length > 0) {
        for (const id of macetIds) {
          await db.update(pinjaman).set({ status: "macet" }).where(eq(pinjaman.id, id));
        }
      }
    }

    return { updated: changed ?? 0 };
  }

  async bayarAngsuran(data: AngsuranInput) {
    const p = await db.select().from(pinjaman).where(eq(pinjaman.id, data.pinjamanId)).get();
    if (!p) throw new HTTPException(404, { message: "Pinjaman tidak ditemukan" });

    const member = await db.select().from(anggota).where(eq(anggota.id, p.anggotaId)).get();

    const angs = await db
      .select()
      .from(angsuran)
      .where(and(eq(angsuran.pinjamanId, data.pinjamanId), eq(angsuran.status, "belum_lunas")))
      .orderBy(angsuran.angsuranKe)
      .limit(1)
      .get();

    if (!angs) throw new HTTPException(400, { message: "Tidak ada angsuran yang menunggu pembayaran" });

    // Hitung denda otomatis jika telat
    const denda = await this.getDenda(angs.tanggalJatuhTempo);
    const totalBayar = Number(angs.jumlahPokok) + Number(angs.jumlahBunga) + denda;

    await db
      .update(angsuran)
      .set({
        status: "lunas",
        tanggalBayar: data.tanggalBayar,
        metodeBayar: data.metodeBayar as any,
        denda: String(denda),
        totalBayar: String(totalBayar),
      })
      .where(eq(angsuran.id, angs.id));

    // Auto-create jurnal angsuran
    await jurnalAngsuran({
      angsuranId: angs.id,
      pinjamanId: data.pinjamanId,
      anggotaNama: member?.nama || "-",
      pokok: Number(angs.jumlahPokok),
      bunga: Number(angs.jumlahBunga),
      denda,
      tanggal: data.tanggalBayar,
      metodeBayar: data.metodeBayar,
    });

    // Check if all angsuran paid
    const remaining = await db
      .select()
      .from(angsuran)
      .where(and(eq(angsuran.pinjamanId, data.pinjamanId), eq(angsuran.status, "belum_lunas")))
      .get();

    if (!remaining) {
      await db.update(pinjaman).set({ status: "lunas" }).where(eq(pinjaman.id, data.pinjamanId));
    }

    return { angsuranId: angs.id, status: "lunas", denda };
  }

  async getKolektibilitasSummary() {
    const allPinjaman = await db.select().from(pinjaman).where(eq(pinjaman.status, "aktif"));
    const summary = { 1: 0, 2: 0, 3: 0, 4: 0 };
    if (allPinjaman.length === 0) return summary;

    const kolMap = await this.getKolektibilitasMap(allPinjaman);
    for (const val of Object.values(kolMap)) {
      summary[val as keyof typeof summary]++;
    }
    return summary;
  }
}

export const pinjamanService = new PinjamanService();
