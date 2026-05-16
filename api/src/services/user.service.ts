import { eq, desc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../lib/db.js";
import { users } from "../../database/schema/index.js";
import type { CreateUserInput, UpdateUserInput } from "@koperasi/shared/schemas";

export class UserService {
  async list() {
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        nama: users.nama,
        role: users.role,
        aktif: users.aktif,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return { data };
  }

  async getById(id: string) {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        nama: users.nama,
        role: users.role,
        aktif: users.aktif,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!user) throw new HTTPException(404, { message: "User tidak ditemukan" });
    return { data: user };
  }

  async create(data: CreateUserInput) {
    const existing = await db.select().from(users).where(eq(users.email, data.email)).get();
    if (existing) throw new HTTPException(400, { message: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(data.password, 10);
    const id = crypto.randomUUID();

    await db.insert(users).values({
      id,
      email: data.email,
      password: hashed,
      nama: data.nama,
      role: data.role,
    });

    return { id };
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) throw new HTTPException(404, { message: "User tidak ditemukan" });
    if (user.role === "super_admin" && data.role && data.role !== "super_admin") {
      throw new HTTPException(400, { message: "Tidak bisa mengubah role super admin" });
    }

    if (data.email && data.email !== user.email) {
      const existing = await db.select().from(users).where(eq(users.email, data.email)).get();
      if (existing) throw new HTTPException(400, { message: "Email sudah terdaftar" });
    }

    await db.update(users).set(data).where(eq(users.id, id));
    return { id };
  }

  async deactivate(id: string) {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) throw new HTTPException(404, { message: "User tidak ditemukan" });
    if (user.role === "super_admin") {
      throw new HTTPException(400, { message: "Tidak bisa menonaktifkan super admin" });
    }

    await db.update(users).set({ aktif: false }).where(eq(users.id, id));
    return { id, aktif: false };
  }

  async activate(id: string) {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) throw new HTTPException(404, { message: "User tidak ditemukan" });

    await db.update(users).set({ aktif: true }).where(eq(users.id, id));
    return { id, aktif: true };
  }
}

export const userService = new UserService();
