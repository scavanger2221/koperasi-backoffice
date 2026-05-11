import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { db } from "../lib/db.js";
import { config } from "../lib/config.js";
import { users, anggota } from "../../database/schema/index.js";
import type { LoginInput, RegisterInput } from "@koperasi/shared/schemas";
import type { UserRole } from "@koperasi/shared/types";
import crypto from "crypto";

export class AuthService {
  async login(data: LoginInput) {
    const user = await db.select().from(users).where(eq(users.email, data.email)).get();
    if (!user || !user.aktif) {
      throw new HTTPException(401, { message: "Email atau password salah" });
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new HTTPException(401, { message: "Email atau password salah" });
    }

    const token = await sign(
      {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
      config.jwtSecret
    );

    await db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id));

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
      },
    };
  }

  async register(data: RegisterInput) {
    const existing = await db.select().from(users).where(eq(users.email, data.email)).get();
    if (existing) {
      throw new HTTPException(409, { message: "Email sudah terdaftar" });
    }

    const existingNik = await db.select().from(anggota).where(eq(anggota.nik, data.nik)).get();
    if (existingNik) {
      throw new HTTPException(409, { message: "NIK sudah terdaftar" });
    }

    const anggotaId = crypto.randomUUID();
    const noAnggota = await this.generateNoAnggota();

    await db.insert(anggota).values({
      id: anggotaId,
      noAnggota,
      nik: data.nik,
      nama: data.nama,
      tempatLahir: "-",
      tanggalLahir: "2000-01-01",
      alamat: data.alamat,
      pekerjaan: "-",
      noTelepon: data.noTelepon,
      email: data.email,
      status: "menunggu_verifikasi",
    });

    const hashed = await bcrypt.hash(data.password, 10);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      anggotaId,
      email: data.email,
      password: hashed,
      nama: data.nama,
      role: "anggota" as UserRole,
    });

    const token = await sign(
      {
        id: userId,
        email: data.email,
        nama: data.nama,
        role: "anggota",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
      config.jwtSecret
    );

    return {
      token,
      user: {
        id: userId,
        email: data.email,
        nama: data.nama,
        role: "anggota",
      },
    };
  }

  private async generateNoAnggota() {
    const count = await db.$count(anggota);
    return `AG${String(count + 1).padStart(5, "0")}`;
  }

  async me(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
      throw new HTTPException(404, { message: "User tidak ditemukan" });
    }
    return {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
      anggotaId: user.anggotaId,
    };
  }
}

export const authService = new AuthService();
