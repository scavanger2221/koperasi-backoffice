/**
 * E2E Test Seed — unified CLI tool.
 *
 * Usage:
 *   npx tsx src/lib/seed-e2e.ts clean              # Remove all test data
 *   npx tsx src/lib/seed-e2e.ts jurnal              # Seed jurnal transactions for 2025
 *   npx tsx src/lib/seed-e2e.ts jurnal --tahun 2024 # Seed for a specific year
 *   npx tsx src/lib/seed-e2e.ts all                 # Clean + seed jurnal
 *   npx tsx src/lib/seed-e2e.ts all --tahun 2025    # Clean + seed for specific year
 */

import Database from "better-sqlite3";
import crypto from "crypto";

const DB_PATH = "./data/koperasi.db";

// ─── Clean ───────────────────────────────────────────────────────────────────

export function cleanupE2E(sqlite?: Database.Database) {
  const db = sqlite || new Database(DB_PATH);
  const close = !sqlite;

  console.log("🧹  Cleaning up e2e test data...");

  // SHU anggota
  const shuAnggota = db.prepare("SELECT id FROM shu_anggota").all() as { id: string }[];
  for (const sa of shuAnggota) {
    db.prepare("DELETE FROM shu_anggota WHERE id = ?").run(sa.id);
  }
  if (shuAnggota.length > 0) console.log(`    ${shuAnggota.length} shu_anggota`);

  // SHU
  const shuRecords = db.prepare("SELECT id FROM shu").all() as { id: string }[];
  for (const s of shuRecords) {
    db.prepare("DELETE FROM shu WHERE id = ?").run(s.id);
  }
  if (shuRecords.length > 0) console.log(`    ${shuRecords.length} shu`);

  // Jurnal (semua tahun, biar fleksibel)
  const jurnals = db.prepare("SELECT id FROM jurnal WHERE ref_tipe = 'jurnal_umum' AND keterangan LIKE 'E2E:%'").all() as { id: string }[];
  for (const j of jurnals) {
    db.prepare("DELETE FROM jurnal_detail WHERE jurnal_id = ?").run(j.id);
    db.prepare("DELETE FROM jurnal WHERE id = ?").run(j.id);
  }
  if (jurnals.length > 0) console.log(`    ${jurnals.length} jurnal (E2E)`);

  console.log("✅  Cleanup complete!");
  if (close) db.close();
}

// ─── Seed Jurnal ─────────────────────────────────────────────────────────────

export function seedJurnalE2E(tahun: number = 2025, sqlite?: Database.Database) {
  const db = sqlite || new Database(DB_PATH);
  const close = !sqlite;

  console.log(`📦  Seeding E2E jurnal data untuk ${tahun}...`);

  // Map akun kode → id
  const akunMap = new Map<string, string>();
  const akunRows = db.prepare("SELECT id, kode FROM akun").all() as { id: string; kode: string }[];
  for (const a of akunRows) akunMap.set(a.kode, a.id);

  const kas = akunMap.get("1-1000") || "";
  const revenue = akunMap.get("4-1000") || "";
  const gaji = akunMap.get("5-1000") || "";
  const listrik = akunMap.get("5-2000") || "";

  if (!kas || !revenue || !gaji || !listrik) {
    console.error("❌  Akun belum ada. Jalankan seed-coa.ts dulu.");
    if (close) db.close();
    process.exit(1);
  }

  function jurnal(tgl: string, desc: string, details: { akun: string; debit: number; kredit: number }[]) {
    const id = crypto.randomUUID();
    const noJurnal = `JR${tgl.replace(/-/g, "")}${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(
      "INSERT INTO jurnal (id, tanggal, no_jurnal, keterangan, ref_tipe, ref_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, tgl, noJurnal, desc, "jurnal_umum", null);

    for (const d of details) {
      const akunId = akunMap.get(d.akun);
      if (!akunId) continue;
      db.prepare(
        "INSERT INTO jurnal_detail (id, jurnal_id, akun_id, debit, kredit) VALUES (?, ?, ?, ?, ?)"
      ).run(crypto.randomUUID(), id, akunId, String(d.debit), String(d.kredit));
    }
  }

  // Pendapatan bunga pinjaman: Rp 5-7jt/bulan (12x)
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    const nominal = 5_000_000 + Math.floor(Math.random() * 2_000_000);
    jurnal(`${tahun}-${mm}-28`, `E2E:Pendapatan bunga pinjaman bulan ${m}`, [
      { akun: "1-1000", debit: nominal, kredit: 0 },
      { akun: "4-1000", debit: 0, kredit: nominal },
    ]);
  }

  // Biaya gaji: Rp 3jt/bulan (12x)
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    jurnal(`${tahun}-${mm}-25`, `E2E:Biaya gaji bulan ${m}`, [
      { akun: "5-1000", debit: 3_000_000, kredit: 0 },
      { akun: "1-1000", debit: 0, kredit: 3_000_000 },
    ]);
  }

  // Biaya listrik & air: Rp 500rb/bulan (12x)
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, "0");
    jurnal(`${tahun}-${mm}-15`, `E2E:Biaya listrik & air bulan ${m}`, [
      { akun: "5-2000", debit: 500_000, kredit: 0 },
      { akun: "1-1000", debit: 0, kredit: 500_000 },
    ]);
  }

  // Total laporan
  const totalRev = (db.prepare("SELECT SUM(CAST(kredit AS INTEGER)) as t FROM jurnal_detail WHERE akun_id = ? AND jurnal_id IN (SELECT id FROM jurnal WHERE keterangan LIKE 'E2E:%')").get(revenue) as any)?.t || 0;
  const totalGaji = (db.prepare("SELECT SUM(CAST(debit AS INTEGER)) as t FROM jurnal_detail WHERE akun_id = ? AND jurnal_id IN (SELECT id FROM jurnal WHERE keterangan LIKE 'E2E:%')").get(gaji) as any)?.t || 0;
  const totalListrik = (db.prepare("SELECT SUM(CAST(debit AS INTEGER)) as t FROM jurnal_detail WHERE akun_id = ? AND jurnal_id IN (SELECT id FROM jurnal WHERE keterangan LIKE 'E2E:%')").get(listrik) as any)?.t || 0;
  const totalBiaya = totalGaji + totalListrik;
  const shu = totalRev - totalBiaya;

  console.log(`✅  Selesai: ${tahun}`);
  console.log(`    Pendapatan: Rp ${totalRev.toLocaleString()}`);
  console.log(`    Biaya:      Rp ${totalBiaya.toLocaleString()}`);
  console.log(`    SHU:        Rp ${shu.toLocaleString()}`);

  if (close) db.close();
  return { totalPendapatan: totalRev, totalBiaya, totalSHU: shu };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  const tahunIdx = args.indexOf("--tahun");
  const tahun = tahunIdx >= 0 ? parseInt(args[tahunIdx + 1]) || 2025 : 2025;

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(`
E2E Test Seed — unified seed & cleanup tool

Usage:
  npx tsx src/lib/seed-e2e.ts clean              # Remove all test data
  npx tsx src/lib/seed-e2e.ts jurnal             # Seed jurnal transactions for 2025
  npx tsx src/lib/seed-e2e.ts jurnal --tahun 2024
  npx tsx src/lib/seed-e2e.ts all [--tahun N]   # Clean + seed
`);
    process.exit(0);
  }

  if (cmd === "clean") {
    cleanupE2E();
    process.exit(0);
  }

  if (cmd === "jurnal") {
    seedJurnalE2E(tahun);
    process.exit(0);
  }

  if (cmd === "all") {
    cleanupE2E();
    console.log("");
    seedJurnalE2E(tahun);
    process.exit(0);
  }

  console.error(`Perintah tidak dikenal: "${cmd}". Gunakan --help.`);
  process.exit(1);
}

// Run only when called directly (not imported)
if (process.argv[1]?.endsWith("seed-e2e.ts") || process.argv[1]?.endsWith("seed-e2e.js")) {
  main();
}
