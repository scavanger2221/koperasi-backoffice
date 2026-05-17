import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

const DATA = [
  // Aset (1-xxxx)
  { kode: "1-1000", nama: "Kas", tipe: "aset" as const, saldoNormal: "debit" as const },
  { kode: "1-1100", nama: "Bank BRI", tipe: "aset" as const, saldoNormal: "debit" as const },
  { kode: "1-1200", nama: "Bank BCA", tipe: "aset" as const, saldoNormal: "debit" as const },
  { kode: "1-2000", nama: "Piutang Pinjaman", tipe: "aset" as const, saldoNormal: "debit" as const },
  { kode: "1-3000", nama: "Perlengkapan", tipe: "aset" as const, saldoNormal: "debit" as const },
  // Kewajiban (2-xxxx)
  { kode: "2-1000", nama: "Simpanan Pokok", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
  { kode: "2-1100", nama: "Simpanan Wajib", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
  { kode: "2-1200", nama: "Simpanan Sukarela", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
  { kode: "2-2000", nama: "Hutang Dagang", tipe: "kewajiban" as const, saldoNormal: "kredit" as const },
  // Ekuitas (3-xxxx)
  { kode: "3-1000", nama: "Modal Penyertaan", tipe: "ekuitas" as const, saldoNormal: "kredit" as const },
  { kode: "3-2000", nama: "Dana Cadangan", tipe: "ekuitas" as const, saldoNormal: "kredit" as const },
  { kode: "3-3000", nama: "SHU Tahun Berjalan", tipe: "ekuitas" as const, saldoNormal: "kredit" as const },
  // Pendapatan (4-xxxx)
  { kode: "4-1000", nama: "Pendapatan Bunga Pinjaman", tipe: "pendapatan" as const, saldoNormal: "kredit" as const },
  { kode: "4-2000", nama: "Pendapatan Administrasi", tipe: "pendapatan" as const, saldoNormal: "kredit" as const },
  { kode: "4-3000", nama: "Pendapatan Lain-lain", tipe: "pendapatan" as const, saldoNormal: "kredit" as const },
  // Biaya (5-xxxx)
  { kode: "5-1000", nama: "Biaya Gaji", tipe: "biaya" as const, saldoNormal: "debit" as const },
  { kode: "5-2000", nama: "Biaya Listrik & Air", tipe: "biaya" as const, saldoNormal: "debit" as const },
  { kode: "5-3000", nama: "Biaya ATK", tipe: "biaya" as const, saldoNormal: "debit" as const },
  { kode: "5-4000", nama: "Biaya Operasional", tipe: "biaya" as const, saldoNormal: "debit" as const },
];

export async function seedAkun(db: BetterSQLite3Database<typeof schema>) {
  let count = 0;
  for (const a of DATA) {
    const existing = db.select().from(schema.akun).where(eq(schema.akun.kode, a.kode)).get();
    if (existing) {
      console.log(`${a.kode} ${a.nama} already exists, skipping`);
      continue;
    }
    db.insert(schema.akun).values({
      id: crypto.randomUUID(),
      ...a,
    }).run();
    console.log(`${a.kode} ${a.nama}`);
    count++;
  }
  if (count === 0) console.log("all akun already exist");
}
