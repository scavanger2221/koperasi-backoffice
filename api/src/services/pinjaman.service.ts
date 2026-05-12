import { eq, and, desc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
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
      .select()
      .from(pinjaman)
      .where(conditions)
      .orderBy(desc(pinjaman.createdAt))
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
    const angsuranList = await db
      .select()
      .from(angsuran)
      .where(eq(angsuran.pinjamanId, pinjamanId));

    let maxTelat = 0;
    for (const a of angsuranList) {
      if (a.status === "lunas" || a.status === "telat") {
        if (a.tanggalBayar) {
          const due = new Date(a.tanggalJatuhTempo);
          const bayar = new Date(a.tanggalBayar);
          const diff = Math.floor((bayar.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          if (diff > maxTelat) maxTelat = diff;
        }
      } else if (a.status === "belum_lunas") {
        const today = new Date();
        const due = new Date(a.tanggalJatuhTempo);
        const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > maxTelat) maxTelat = diff;
      }
    }

    if (maxTelat === 0) return 1; // Lancar
    if (maxTelat <= 90) return 2; // Kurang Lancar
    if (maxTelat <= 180) return 3; // Diragukan
    return 4; // Macet
  }

  async cekDanUpdateDenda() {
    const today = new Date().toISOString().split("T")[0];
    const unpaid = await db
      .select()
      .from(angsuran)
      .where(and(eq(angsuran.status, "belum_lunas"), sql`${angsuran.tanggalJatuhTempo} < ${today}`));

    for (const a of unpaid) {
      const denda = await this.getDenda(a.tanggalJatuhTempo);
      if (denda > 0) {
        const totalBayar = Number(a.jumlahPokok) + Number(a.jumlahBunga) + denda;
        await db
          .update(angsuran)
          .set({ denda: String(denda), totalBayar: String(totalBayar), status: "telat" })
          .where(eq(angsuran.id, a.id));
      }
    }

    // Update kolektibilitas → macet jika >90 hari
    const activePinjaman = await db.select().from(pinjaman).where(eq(pinjaman.status, "aktif"));
    for (const p of activePinjaman) {
      const kol = await this.getKolektibilitas(p.id);
      if (kol >= 4) {
        await db.update(pinjaman).set({ status: "macet" }).where(eq(pinjaman.id, p.id));
      }
    }

    return { updated: unpaid.length };
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
    for (const p of allPinjaman) {
      const kol = await this.getKolektibilitas(p.id);
      summary[kol as keyof typeof summary]++;
    }
    return summary;
  }
}

export const pinjamanService = new PinjamanService();
