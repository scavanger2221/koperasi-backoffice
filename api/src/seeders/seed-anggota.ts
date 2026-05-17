import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

const DATA = [
  {
    noAnggota: "AG00001",
    nik: "3175091209870001",
    nama: "Budi Santoso",
    tempatLahir: "Jakarta",
    tanggalLahir: "1987-09-12",
    alamat: "Jl. Merdeka No. 1, Jakarta",
    pekerjaan: "Pegawai Swasta",
    noTelepon: "081234567890",
    email: "budi@email.com",
    status: "aktif" as const,
  },
  {
    noAnggota: "AG00002",
    nik: "3175091209870002",
    nama: "Siti Aminah",
    tempatLahir: "Bandung",
    tanggalLahir: "1990-03-15",
    alamat: "Jl. Sudirman No. 5, Bandung",
    pekerjaan: "Guru",
    noTelepon: "081234567891",
    email: "siti@email.com",
    status: "aktif" as const,
  },
];

export async function seedAnggota(db: BetterSQLite3Database<typeof schema>) {
  let count = 0;
  for (const a of DATA) {
    const existing = db.select().from(schema.anggota).where(eq(schema.anggota.noAnggota, a.noAnggota)).get();
    if (existing) {
      console.log(`${a.noAnggota} ${a.nama} already exists, skipping`);
      continue;
    }
    db.insert(schema.anggota).values({
      id: crypto.randomUUID(),
      ...a,
    }).run();
    console.log(`${a.noAnggota} ${a.nama}`);
    count++;
  }
  if (count === 0) console.log("all anggota already exist");
}
