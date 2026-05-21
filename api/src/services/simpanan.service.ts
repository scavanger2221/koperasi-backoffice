import { eq, and, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { simpanan, anggota } from "../../database/schema/index.js";
import { jurnalSimpanan } from "./jurnal.service.js";
import type { SimpananInput } from "@koperasi/shared/schemas";

export class SimpananService {
  async list({ anggotaId, jenis, page = 1, limit = 20 }: { anggotaId?: string; jenis?: string; page?: number; limit?: number }) {
    const offset = (page - 1) * limit;

    let conditions = undefined;
    if (anggotaId) conditions = eq(simpanan.anggotaId, anggotaId);
    if (jenis) {
      const jenisCond = eq(simpanan.jenis, jenis as any);
      conditions = conditions ? and(conditions, jenisCond) : jenisCond;
    }

    const data = await db
      .select({
        simpanan: simpanan,
        anggotaNama: anggota.nama,
        anggotaNo: anggota.noAnggota,
      })
      .from(simpanan)
      .leftJoin(anggota, eq(simpanan.anggotaId, anggota.id))
      .where(conditions)
      .orderBy(sql`${simpanan.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    const total = await db.$count(simpanan, conditions);

    const result = data.map((row) => ({
      ...row.simpanan,
      anggota: row.anggotaNama ? { nama: row.anggotaNama, noAnggota: row.anggotaNo } : null,
    }));

    return { data: result, meta: { page, limit, total } };
  }

  async create(data: SimpananInput) {
    const member = await db.select().from(anggota).where(eq(anggota.id, data.anggotaId)).get();
    if (!member) throw new HTTPException(404, { message: "Anggota tidak ditemukan" });
    if (member.status !== "aktif") throw new HTTPException(400, { message: "Anggota tidak aktif" });

    const id = crypto.randomUUID();
    await db.insert(simpanan).values({
      id,
      anggotaId: data.anggotaId,
      jenis: data.jenis,
      jumlah: data.jumlah,
      tanggal: data.tanggal,
      metodeBayar: data.metodeBayar,
      keterangan: data.keterangan,
    });

    // Auto-create jurnal
    await jurnalSimpanan({
      simpananId: id,
      anggotaNama: member.nama,
      jenis: data.jenis,
      jumlah: Number(data.jumlah),
      tanggal: data.tanggal,
      metodeBayar: data.metodeBayar,
    });

    return { id };
  }

  async getSaldo(anggotaId: string) {
    const rows = await db.select().from(simpanan).where(eq(simpanan.anggotaId, anggotaId));
    const saldo = {
      pokok: 0,
      wajib: 0,
      sukarela: 0,
      deposito: 0,
      total: 0,
    };

    for (const r of rows) {
      const jml = Number(r.jumlah);
      if (r.jenis === "pokok") saldo.pokok += jml;
      if (r.jenis === "wajib") saldo.wajib += jml;
      if (r.jenis === "sukarela") saldo.sukarela += jml;
      if (r.jenis === "deposito") saldo.deposito += jml;
      saldo.total += jml;
    }

    return saldo;
  }
}

export const simpananService = new SimpananService();
