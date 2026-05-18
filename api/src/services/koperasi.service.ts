import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { koperasi } from "../../database/schema/index.js";

class KoperasiService {
  async get() {
    const data = await db.select().from(koperasi).get();
    return data || null;
  }

  async create(body: {
    nama: string;
    alamat?: string;
    badanHukum?: string;
    jenis?: string;
    logo?: string;
    noTelepon?: string;
    email?: string;
    website?: string;
    kota?: string;
    provinsi?: string;
  }) {
    const existing = await db.select().from(koperasi).get();
    if (existing) {
      throw new HTTPException(400, {
        message: "Data koperasi sudah ada. Gunakan endpoint update untuk mengubah.",
      });
    }

    const id = crypto.randomUUID();
    await db.insert(koperasi).values({
      id,
      nama: body.nama,
      alamat: body.alamat || null,
      badanHukum: body.badanHukum || null,
      jenis: (body.jenis as any) || "ksp",
      logo: body.logo || null,
      noTelepon: body.noTelepon || null,
      email: body.email || null,
      website: body.website || null,
      kota: body.kota || null,
      provinsi: body.provinsi || null,
    });

    const result = await db.select().from(koperasi).where(eq(koperasi.id, id)).get();
    return result;
  }

  async update(body: {
    nama?: string;
    alamat?: string;
    badanHukum?: string;
    jenis?: string;
    logo?: string;
    noTelepon?: string;
    email?: string;
    website?: string;
    kota?: string;
    provinsi?: string;
  }) {
    const existing = await db.select().from(koperasi).get();
    if (!existing) {
      throw new HTTPException(404, { message: "Data koperasi belum ada. Buat data baru terlebih dahulu." });
    }

    const updates: Record<string, any> = {};
    if (body.nama !== undefined) updates.nama = body.nama;
    if (body.alamat !== undefined) updates.alamat = body.alamat;
    if (body.badanHukum !== undefined) updates.badanHukum = body.badanHukum;
    if (body.jenis !== undefined) updates.jenis = body.jenis;
    if (body.logo !== undefined) updates.logo = body.logo;
    if (body.noTelepon !== undefined) updates.noTelepon = body.noTelepon;
    if (body.email !== undefined) updates.email = body.email;
    if (body.website !== undefined) updates.website = body.website;
    if (body.kota !== undefined) updates.kota = body.kota;
    if (body.provinsi !== undefined) updates.provinsi = body.provinsi;

    if (Object.keys(updates).length === 0) {
      throw new HTTPException(400, { message: "Tidak ada data yang diubah" });
    }

    await db.update(koperasi).set(updates).where(eq(koperasi.id, existing.id));

    const result = await db.select().from(koperasi).where(eq(koperasi.id, existing.id)).get();
    return result;
  }
}

export const koperasiService = new KoperasiService();
