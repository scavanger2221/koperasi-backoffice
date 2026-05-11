import { eq, like, desc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { anggota, users } from "../../database/schema/index.js";
import type { AnggotaInput, AnggotaUpdateInput } from "@koperasi/shared/schemas";

export class AnggotaService {
  async list({ page = 1, limit = 20, search = "" }: { page?: number; limit?: number; search?: string }) {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? sql`${anggota.nama} LIKE ${`%${search}%`} OR ${anggota.noAnggota} LIKE ${`%${search}%`}`
      : undefined;

    const data = await db
      .select()
      .from(anggota)
      .where(whereClause)
      .orderBy(desc(anggota.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db.$count(anggota, whereClause);

    return { data, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const row = await db.select().from(anggota).where(eq(anggota.id, id)).get();
    if (!row) throw new HTTPException(404, { message: "Anggota tidak ditemukan" });
    return row;
  }

  async create(data: AnggotaInput) {
    const existingNik = await db.select().from(anggota).where(eq(anggota.nik, data.nik)).get();
    if (existingNik) {
      throw new HTTPException(409, { message: "NIK sudah terdaftar" });
    }

    const id = crypto.randomUUID();
    const noAnggota = await this.generateNoAnggota();

    await db.insert(anggota).values({
      id,
      noAnggota,
      nik: data.nik,
      nama: data.nama,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      alamat: data.alamat,
      pekerjaan: data.pekerjaan,
      noTelepon: data.noTelepon,
      email: data.email || null,
      status: "aktif",
    });

    return this.getById(id);
  }

  async update(id: string, data: AnggotaUpdateInput) {
    await this.getById(id);
    await db.update(anggota).set(data).where(eq(anggota.id, id));
    return this.getById(id);
  }

  async deactivate(id: string) {
    await this.getById(id);
    await db.update(anggota).set({ status: "nonaktif", tanggalKeluar: new Date().toISOString().split("T")[0] }).where(eq(anggota.id, id));
    return { id, status: "nonaktif" };
  }

  private async generateNoAnggota() {
    const count = await db.$count(anggota);
    return `AG${String(count + 1).padStart(5, "0")}`;
  }
}

export const anggotaService = new AnggotaService();
