import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as schema from "../../database/schema/index.js";

const sqlite = new Database("./data/koperasi.db");
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await db.insert(schema.users).values({
    id: adminId,
    email: "admin@koperasi.id",
    password: hashedPassword,
    nama: "Admin Koperasi",
    role: "admin",
  });

  // Create sample anggota
  const anggota1Id = crypto.randomUUID();
  await db.insert(schema.anggota).values({
    id: anggota1Id,
    noAnggota: "AG00001",
    nik: "3175091209870001",
    nama: "Budi Santoso",
    tempatLahir: "Jakarta",
    tanggalLahir: "1987-09-12",
    alamat: "Jl. Merdeka No. 1, Jakarta",
    pekerjaan: "Pegawai Swasta",
    noTelepon: "081234567890",
    email: "budi@email.com",
    status: "aktif",
  });

  const anggota2Id = crypto.randomUUID();
  await db.insert(schema.anggota).values({
    id: anggota2Id,
    noAnggota: "AG00002",
    nik: "3175091209870002",
    nama: "Siti Aminah",
    tempatLahir: "Bandung",
    tanggalLahir: "1990-03-15",
    alamat: "Jl. Sudirman No. 5, Bandung",
    pekerjaan: "Guru",
    noTelepon: "081234567891",
    email: "siti@email.com",
    status: "aktif",
  });

  // Create simpanan
  await db.insert(schema.simpanan).values({
    id: crypto.randomUUID(),
    anggotaId: anggota1Id,
    jenis: "pokok",
    jumlah: "100000",
    tanggal: "2025-01-15",
    metodeBayar: "tunai",
  });

  await db.insert(schema.simpanan).values({
    id: crypto.randomUUID(),
    anggotaId: anggota1Id,
    jenis: "wajib",
    jumlah: "50000",
    tanggal: "2025-02-01",
    metodeBayar: "tunai",
  });

  await db.insert(schema.simpanan).values({
    id: crypto.randomUUID(),
    anggotaId: anggota2Id,
    jenis: "pokok",
    jumlah: "100000",
    tanggal: "2025-01-20",
    metodeBayar: "transfer",
  });

  console.log("✅ Seed completed!");
  console.log("Admin login: admin@koperasi.id / admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
