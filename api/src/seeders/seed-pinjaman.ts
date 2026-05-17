import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedPinjaman(db: BetterSQLite3Database<typeof schema>) {
  const budi = db.select().from(schema.anggota).where(eq(schema.anggota.noAnggota, "AG00001")).get();
  if (!budi) {
    console.log("anggota not found, skipping");
    return;
  }

  const existing = db.select().from(schema.pinjaman).limit(1).all();
  if (existing.length > 0) {
    console.log("pinjaman already exist, skipping");
    return;
  }

  const pinjamanId = crypto.randomUUID();
  const jumlah = "5000000";
  const bungaPersen = "10";
  const jangkaWaktu = 12;
  const angsuranPerBulan = "458333"; // 5jt + 10% / 12

  db.insert(schema.pinjaman).values({
    id: pinjamanId,
    anggotaId: budi.id,
    noPinjaman: "PJ00001",
    jumlah,
    bungaPersen,
    jenisBunga: "flat",
    jangkaWaktu,
    angsuranPerBulan,
    status: "aktif",
    tanggalPengajuan: "2025-01-10",
    tanggalAcc: "2025-01-15",
    tanggalPencairan: "2025-01-20",
    keterangan: "Pinjaman modal usaha",
  }).run();

  // Create 12 angsuran schedule
  for (let i = 1; i <= jangkaWaktu; i++) {
    const month = i + 1; // starts Feb 2025
    const year = month > 12 ? 2026 : 2025;
    const m = month > 12 ? month - 12 : month;
    const tgl = `${year}-${String(m).padStart(2, "0")}-20`;

    db.insert(schema.angsuran).values({
      id: crypto.randomUUID(),
      pinjamanId,
      angsuranKe: i,
      tanggalJatuhTempo: tgl,
      jumlahPokok: String(Math.floor(Number(jumlah) / jangkaWaktu)),
      jumlahBunga: String(Math.floor(Number(jumlah) * Number(bungaPersen) / 100 / jangkaWaktu)),
      denda: "0",
      totalBayar: angsuranPerBulan,
      status: i <= 3 ? "lunas" : "belum_lunas",
      tanggalBayar: i <= 3 ? tgl : undefined,
      metodeBayar: i <= 3 ? "tunai" : undefined,
    }).run();
  }

  console.log("1 pinjaman + 12 angsuran created");
}
