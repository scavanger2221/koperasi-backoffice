import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import crypto from "crypto";
import * as schema from "../../database/schema/index.js";
import { eq } from "drizzle-orm";

const sqlite = new Database("./data/koperasi.db");
const db = drizzle(sqlite, { schema });

const defaultAkun = [
  // Aset (1-xxxx)
  { kode: "1-1000", nama: "Kas", tipe: "aset", saldoNormal: "debit" },
  { kode: "1-1100", nama: "Bank BRI", tipe: "aset", saldoNormal: "debit" },
  { kode: "1-1200", nama: "Bank BCA", tipe: "aset", saldoNormal: "debit" },
  { kode: "1-2000", nama: "Piutang Pinjaman", tipe: "aset", saldoNormal: "debit" },
  { kode: "1-3000", nama: "Perlengkapan", tipe: "aset", saldoNormal: "debit" },

  // Kewajiban (2-xxxx)
  { kode: "2-1000", nama: "Simpanan Pokok", tipe: "kewajiban", saldoNormal: "kredit" },
  { kode: "2-1100", nama: "Simpanan Wajib", tipe: "kewajiban", saldoNormal: "kredit" },
  { kode: "2-1200", nama: "Simpanan Sukarela", tipe: "kewajiban", saldoNormal: "kredit" },
  { kode: "2-2000", nama: "Hutang Dagang", tipe: "kewajiban", saldoNormal: "kredit" },

  // Ekuitas (3-xxxx)
  { kode: "3-1000", nama: "Modal Penyertaan", tipe: "ekuitas", saldoNormal: "kredit" },
  { kode: "3-2000", nama: "Dana Cadangan", tipe: "ekuitas", saldoNormal: "kredit" },
  { kode: "3-3000", nama: "SHU Tahun Berjalan", tipe: "ekuitas", saldoNormal: "kredit" },

  // Pendapatan (4-xxxx)
  { kode: "4-1000", nama: "Pendapatan Bunga Pinjaman", tipe: "pendapatan", saldoNormal: "kredit" },
  { kode: "4-2000", nama: "Pendapatan Administrasi", tipe: "pendapatan", saldoNormal: "kredit" },
  { kode: "4-3000", nama: "Pendapatan Lain-lain", tipe: "pendapatan", saldoNormal: "kredit" },

  // Biaya (5-xxxx)
  { kode: "5-1000", nama: "Biaya Gaji", tipe: "biaya", saldoNormal: "debit" },
  { kode: "5-2000", nama: "Biaya Listrik & Air", tipe: "biaya", saldoNormal: "debit" },
  { kode: "5-3000", nama: "Biaya ATK", tipe: "biaya", saldoNormal: "debit" },
  { kode: "5-4000", nama: "Biaya Operasional", tipe: "biaya", saldoNormal: "debit" },
];

async function seedAkun() {
  console.log("Seeding chart of accounts...");

  for (const a of defaultAkun) {
    const existing = await db.select().from(schema.akun).where(eq(schema.akun.kode, a.kode)).get();
    if (!existing) {
      await db.insert(schema.akun).values({
        id: crypto.randomUUID(),
        kode: a.kode,
        nama: a.nama,
        tipe: a.tipe as any,
        saldoNormal: a.saldoNormal as any,
      });
      console.log(`  ✅ ${a.kode} - ${a.nama}`);
    } else {
      console.log(`  ⏭️  ${a.kode} - ${a.nama} (already exists)`);
    }
  }

  console.log("✅ Chart of accounts seeded!");
  process.exit(0);
}

seedAkun().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
