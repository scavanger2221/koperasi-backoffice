/**
 * Shared test setup — call initTestDb() in beforeAll of every test file.
 *
 * The `app` is imported by the test file.  `db.ts` reads `TEST_DATABASE_URL`
 * from env (set in vitest.config.ts), so no mocking is needed.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import * as schema from "../../database/schema/index.js";

const ADMIN_EMAIL = "admin@koperasi.id";
const ADMIN_PASS = "admin123";

/**
 * Get or create the shared test database handle, run migrations, and seed
 * the admin user if not already present.
 */
export function initTestDb() {
  const sqlite = new Database(process.env.TEST_DATABASE_URL!);
  sqlite.pragma("journal_mode = WAL");
  const testDb = drizzle(sqlite, { schema });
  migrate(testDb, { migrationsFolder: "./database/migrations" });
  return { sqlite, testDb };
}

/** Seed the admin user if it doesn't exist yet. */
export async function seedAdmin(testDb: ReturnType<typeof drizzle>) {
  const existing = testDb
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
    .get();
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASS, 10);
    testDb.insert(schema.users).values({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      password: hashed,
      nama: "Admin Test",
      role: "admin",
    }).run();
  }
}

/** Seed the chart of accounts (akun) if empty. */
export async function seedAkun(testDb: ReturnType<typeof drizzle>) {
  const count = testDb.select({ c: schema.akun.id }).from(schema.akun).all();
  if (count.length > 0) return;

  const akunList = [
    // Aset (1-xxx)
    { kode: "1-1000", nama: "Kas", tipe: "aset" as const, saldoNormal: "debit" as const },
    { kode: "1-1100", nama: "Bank", tipe: "aset" as const, saldoNormal: "debit" as const },
    { kode: "1-2000", nama: "Piutang Pinjaman", tipe: "aset" as const, saldoNormal: "debit" as const },
    // Kewajiban (2-xxx)
    { kode: "2-1000", nama: "Simpanan Pokok", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
    { kode: "2-1100", nama: "Simpanan Wajib", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
    { kode: "2-1200", nama: "Simpanan Sukarela", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
    // Ekuitas (3-xxx)
    { kode: "3-1000", nama: "Modal", tipe: "ekuitas" as const, saldoNormal: "kredit" as const },
    { kode: "3-2000", nama: "Cadangan", tipe: "ekuitas" as const, saldoNormal: "kredit" as const },
    // Pendapatan (4-xxx)
    { kode: "4-1000", nama: "Pendapatan Bunga Pinjaman", tipe: "pendapatan" as const, saldoNormal: "kredit" as const },
    { kode: "4-3000", nama: "Pendapatan Denda", tipe: "pendapatan" as const, saldoNormal: "kredit" as const },
    // Biaya (5-xxx)
    { kode: "5-1000", nama: "Biaya Operasional", tipe: "biaya" as const, saldoNormal: "debit" as const },
    { kode: "5-2000", nama: "Biaya Administrasi", tipe: "biaya" as const, saldoNormal: "debit" as const },
  ];
  for (const a of akunList) {
    testDb.insert(schema.akun).values({ id: randomUUID(), ...a }).run();
  }
}

/** Login as admin and return the token. */
export async function getAdminToken(app: any): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const body = await res.json();
  if (!body.success) throw new Error(`Login failed: ${body.error?.message}`);
  return body.data.token;
}

/** Create a test member and return its id. */
export async function createTestAnggota(
  app: any,
  token: string,
  overrides: Record<string, any> = {}
): Promise<string> {
  const res = await app.request("/api/anggota", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      nik: overrides.nik ?? "1234567890123456",
      nama: overrides.nama ?? "Test Member",
      tempatLahir: overrides.tempatLahir ?? "Jakarta",
      tanggalLahir: overrides.tanggalLahir ?? "1990-01-01",
      jenisKelamin: overrides.jenisKelamin ?? "laki_laki",
      alamat: overrides.alamat ?? "Jl. Test No. 1",
      pekerjaan: overrides.pekerjaan ?? "Tester",
      noTelepon: overrides.noTelepon ?? "081234567899",
      email: overrides.email ?? "test@example.com",
    }),
  });
  const body = await res.json();
  return body.data.id;
}

/** Activate a member. */
export async function activateAnggota(app: any, token: string, id: string) {
  await app.request(`/api/anggota/${id}/activate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}
