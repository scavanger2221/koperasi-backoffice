import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedJurnal(db: BetterSQLite3Database<typeof schema>) {
  const existing = db.select().from(schema.jurnal).limit(1).all();
  if (existing.length > 0) {
    console.log("jurnal already exist, skipping");
    return;
  }

  // Map akun kode → id
  const akunRows = db.select().from(schema.akun).all();
  const akunMap = new Map(akunRows.map((a) => [a.kode, a.id]));
  const kas = akunMap.get("1-1000");
  const revenue = akunMap.get("4-1000");
  const gaji = akunMap.get("5-1000");
  const listrik = akunMap.get("5-2000");

  if (!kas || !revenue || !gaji || !listrik) {
    console.log("akun not found — run seed-akun first, skipping");
    return;
  }

  const tahun = 2025;
  let count = 0;

  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const nominal = 5_000_000 + Math.floor(Math.random() * 2_000_000);

    // Pendapatan bunga
    const j1 = crypto.randomUUID();
    db.insert(schema.jurnal).values({
      id: j1,
      tanggal: `${tahun}-${mm}-28`,
      noJurnal: `JR${tahun}${mm}28${Math.floor(1000 + Math.random() * 9000)}`,
      keterangan: `Pendapatan bunga pinjaman bulan ${m}`,
      refTipe: "jurnal_umum",
    }).run();
    db.insert(schema.jurnalDetail).values([
      { id: crypto.randomUUID(), jurnalId: j1, akunId: kas, debit: String(nominal), kredit: "0" },
      { id: crypto.randomUUID(), jurnalId: j1, akunId: revenue, debit: "0", kredit: String(nominal) },
    ]).run();

    // Biaya gaji
    const j2 = crypto.randomUUID();
    db.insert(schema.jurnal).values({
      id: j2,
      tanggal: `${tahun}-${mm}-25`,
      noJurnal: `JR${tahun}${mm}25${Math.floor(1000 + Math.random() * 9000)}`,
      keterangan: `Biaya gaji bulan ${m}`,
      refTipe: "jurnal_umum",
    }).run();
    db.insert(schema.jurnalDetail).values([
      { id: crypto.randomUUID(), jurnalId: j2, akunId: gaji, debit: "3000000", kredit: "0" },
      { id: crypto.randomUUID(), jurnalId: j2, akunId: kas, debit: "0", kredit: "3000000" },
    ]).run();

    // Biaya listrik & air
    const j3 = crypto.randomUUID();
    db.insert(schema.jurnal).values({
      id: j3,
      tanggal: `${tahun}-${mm}-15`,
      noJurnal: `JR${tahun}${mm}15${Math.floor(1000 + Math.random() * 9000)}`,
      keterangan: `Biaya listrik & air bulan ${m}`,
      refTipe: "jurnal_umum",
    }).run();
    db.insert(schema.jurnalDetail).values([
      { id: crypto.randomUUID(), jurnalId: j3, akunId: listrik, debit: "500000", kredit: "0" },
      { id: crypto.randomUUID(), jurnalId: j3, akunId: kas, debit: "0", kredit: "500000" },
    ]).run();

    count += 3;
  }

  console.log(`${count} jurnal entries created for ${tahun}`);
}
