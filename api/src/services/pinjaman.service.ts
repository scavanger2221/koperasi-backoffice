import { eq, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { pinjaman, angsuran, anggota } from "../../database/schema/index.js";
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
      .select()
      .from(pinjaman)
      .where(conditions)
      .orderBy(eq(pinjaman.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(pinjaman, conditions);

    const result = [];
    for (const p of data) {
      const a = await db.select().from(anggota).where(eq(anggota.id, p.anggotaId)).get();
      result.push({ ...p, anggota: a ? { nama: a.nama, noAnggota: a.noAnggota } : null });
    }

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

    const tanggalCair = new Date().toISOString().split("T")[0];
    await db
      .update(pinjaman)
      .set({ status: "aktif", tanggalPencairan: tanggalCair })
      .where(eq(pinjaman.id, id));

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

  async bayarAngsuran(data: AngsuranInput) {
    const p = await db.select().from(pinjaman).where(eq(pinjaman.id, data.pinjamanId)).get();
    if (!p) throw new HTTPException(404, { message: "Pinjaman tidak ditemukan" });

    const angs = await db
      .select()
      .from(angsuran)
      .where(and(eq(angsuran.pinjamanId, data.pinjamanId), eq(angsuran.status, "belum_lunas")))
      .orderBy(angsuran.angsuranKe)
      .limit(1)
      .get();

    if (!angs) throw new HTTPException(400, { message: "Tidak ada angsuran yang menunggu pembayaran" });

    await db
      .update(angsuran)
      .set({
        status: "lunas",
        tanggalBayar: data.tanggalBayar,
        metodeBayar: data.metodeBayar as any,
      })
      .where(eq(angsuran.id, angs.id));

    // Check if all angsuran paid
    const remaining = await db
      .select()
      .from(angsuran)
      .where(and(eq(angsuran.pinjamanId, data.pinjamanId), eq(angsuran.status, "belum_lunas")))
      .get();

    if (!remaining) {
      await db.update(pinjaman).set({ status: "lunas" }).where(eq(pinjaman.id, data.pinjamanId));
    }

    return { angsuranId: angs.id, status: "lunas" };
  }
}

export const pinjamanService = new PinjamanService();
