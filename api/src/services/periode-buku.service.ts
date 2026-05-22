import { eq, desc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { periodeBuku } from "../../database/schema/index.js";

class PeriodeBukuService {
  async list({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) {
    const offset = (page - 1) * limit;
    const data = await db
      .select()
      .from(periodeBuku)
      .orderBy(desc(periodeBuku.tahun))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(periodeBuku);
    return { data, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const p = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    if (!p) throw new HTTPException(404, { message: "Periode buku tidak ditemukan" });
    return p;
  }

  async create(body: {
    tahun: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    keterangan?: string;
  }) {
    // Check for duplicate year
    const existing = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.tahun, body.tahun))
      .get();
    if (existing) {
      throw new HTTPException(400, {
        message: `Periode buku tahun ${body.tahun} sudah ada`,
      });
    }

    const id = crypto.randomUUID();
    await db.insert(periodeBuku).values({
      id,
      tahun: body.tahun,
      tanggalMulai: body.tanggalMulai,
      tanggalSelesai: body.tanggalSelesai,
      status: "buka",
      keterangan: body.keterangan || null,
    });

    const result = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    return result;
  }

  async update(
    id: string,
    body: {
      tahun?: number;
      tanggalMulai?: string;
      tanggalSelesai?: string;
      keterangan?: string;
    }
  ) {
    const existing = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    if (!existing) {
      throw new HTTPException(404, { message: "Periode buku tidak ditemukan" });
    }

    const updates: Record<string, any> = {};
    if (body.tahun !== undefined) updates.tahun = body.tahun;
    if (body.tanggalMulai !== undefined) updates.tanggalMulai = body.tanggalMulai;
    if (body.tanggalSelesai !== undefined) updates.tanggalSelesai = body.tanggalSelesai;
    if (body.keterangan !== undefined) updates.keterangan = body.keterangan;

    if (Object.keys(updates).length === 0) {
      throw new HTTPException(400, { message: "Tidak ada data yang diubah" });
    }

    await db.update(periodeBuku).set(updates).where(eq(periodeBuku.id, id));

    const result = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    return result;
  }

  async tutupBuku(id: string) {
    const existing = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    if (!existing) {
      throw new HTTPException(404, { message: "Periode buku tidak ditemukan" });
    }
    if (existing.status === "tutup") {
      throw new HTTPException(400, { message: "Periode buku sudah ditutup" });
    }

    await db
      .update(periodeBuku)
      .set({ status: "tutup" })
      .where(eq(periodeBuku.id, id));

    const result = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    return result;
  }

  async bukaBuku(id: string) {
    const existing = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    if (!existing) {
      throw new HTTPException(404, { message: "Periode buku tidak ditemukan" });
    }
    if (existing.status === "buka") {
      throw new HTTPException(400, { message: "Periode buku sudah terbuka" });
    }

    await db
      .update(periodeBuku)
      .set({ status: "buka" })
      .where(eq(periodeBuku.id, id));

    const result = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    return result;
  }

  async hapus(id: string) {
    const existing = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.id, id))
      .get();
    if (!existing) {
      throw new HTTPException(404, { message: "Periode buku tidak ditemukan" });
    }
    if (existing.status === "tutup") {
      throw new HTTPException(400, {
        message: "Periode buku yang sudah ditutup tidak bisa dihapus",
      });
    }

    await db.delete(periodeBuku).where(eq(periodeBuku.id, id));
    return { id, deleted: true };
  }

  async getAktif() {
    const p = await db
      .select()
      .from(periodeBuku)
      .where(eq(periodeBuku.status, "buka"))
      .orderBy(desc(periodeBuku.tahun))
      .get();
    return p || null;
  }
}

export const periodeBukuService = new PeriodeBukuService();
