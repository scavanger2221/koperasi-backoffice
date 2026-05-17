import crypto from "crypto";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedRat(db: BetterSQLite3Database<typeof schema>) {
  const existing = db.select().from(schema.rat).limit(1).all();
  if (existing.length > 0) {
    console.log("rat already exist, skipping");
    return;
  }

  const anggota = db.select().from(schema.anggota).all();
  if (anggota.length === 0) {
    console.log("no anggota found, skipping");
    return;
  }

  const ratId = crypto.randomUUID();
  db.insert(schema.rat).values({
    id: ratId,
    periode: "2025",
    status: "draft",
    tanggalRAT: "2026-02-15",
    tempat: "Aula Koperasi",
    totalAnggota: anggota.length,
    totalHadir: 0,
    kuorum: false,
    catatan: "RAT 2025 — seed data",
  }).run();

  // Agenda
  db.insert(schema.ratAgenda).values([
    {
      id: crypto.randomUUID(),
      ratId,
      judul: "Laporan Pertanggungjawaban Pengurus",
      catatan: "LPJ Tahun Buku 2025",
    },
    {
      id: crypto.randomUUID(),
      ratId,
      judul: "Laporan Keuangan & SHU 2025",
      catatan: "Pengesahan laporan keuangan dan pembagian SHU",
    },
    {
      id: crypto.randomUUID(),
      ratId,
      judul: "Rencana Kerja & RAPB 2026",
      catatan: "Program kerja dan anggaran tahun depan",
    },
  ]).run();

  console.log(`RAT 2025 created with 3 agenda items`);
}
