import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedShu(db: BetterSQLite3Database<typeof schema>) {
  const existing = db.select().from(schema.shu).limit(1).all();
  if (existing.length > 0) {
    console.log("shu already exist, skipping");
    return;
  }

  // Calculate from jurnal data
  const revenue = db.select().from(schema.akun).where(eq(schema.akun.kode, "4-1000")).get();
  const gaji = db.select().from(schema.akun).where(eq(schema.akun.kode, "5-1000")).get();
  const listrik = db.select().from(schema.akun).where(eq(schema.akun.kode, "5-2000")).get();

  if (!revenue || !gaji || !listrik) {
    console.log("akun not found, skipping");
    return;
  }

  const totalPendapatan = db.select({
    total: schema.jurnalDetail.kredit,
  })
    .from(schema.jurnalDetail)
    .where(eq(schema.jurnalDetail.akunId, revenue.id))
    .all()
    .reduce((sum, r) => sum + Number(r.total), 0);

  const totalBiayaGaji = db.select({
    total: schema.jurnalDetail.debit,
  })
    .from(schema.jurnalDetail)
    .where(eq(schema.jurnalDetail.akunId, gaji.id))
    .all()
    .reduce((sum, r) => sum + Number(r.total), 0);

  const totalBiayaListrik = db.select({
    total: schema.jurnalDetail.debit,
  })
    .from(schema.jurnalDetail)
    .where(eq(schema.jurnalDetail.akunId, listrik.id))
    .all()
    .reduce((sum, r) => sum + Number(r.total), 0);

  const totalBiaya = totalBiayaGaji + totalBiayaListrik;
  const totalShu = totalPendapatan - totalBiaya;

  const shuId = crypto.randomUUID();
  db.insert(schema.shu).values({
    id: shuId,
    periode: "2025",
    totalShu: String(totalShu),
    totalPendapatan: String(totalPendapatan),
    totalBiaya: String(totalBiaya),
    alokasiAnggota: "40",
    alokasiCadangan: "20",
    alokasiPengurus: "10",
    alokasiPendidikan: "5",
    alokasiSosial: "5",
    alokasiLain: "20",
    danaAnggota: String(Math.floor(totalShu * 0.4)),
    danaCadangan: String(Math.floor(totalShu * 0.2)),
    danaPengurus: String(Math.floor(totalShu * 0.1)),
    danaPendidikan: String(Math.floor(totalShu * 0.05)),
    danaSosial: String(Math.floor(totalShu * 0.05)),
    danaLain: String(Math.floor(totalShu * 0.2)),
    totalSimpanan: "250000",
    totalTransaksi: String(totalPendapatan),
    status: "draft",
    keterangan: "SHU Tahun 2025 (seed data)",
  }).run();

  // SHU per anggota
  const anggota = db.select().from(schema.anggota).all();
  const danaAnggota = Math.floor(totalShu * 0.4);
  const totalSimpanan = 250000;

  for (const a of anggota) {
    // Get total simpanan for this anggota
    const simpananAnggota = db.select({
      total: schema.simpanan.jumlah,
    })
      .from(schema.simpanan)
      .where(eq(schema.simpanan.anggotaId, a.id))
      .all()
      .reduce((sum, r) => sum + Number(r.total), 0);

    const jma = simpananAnggota > 0 ? (simpananAnggota / totalSimpanan) * danaAnggota : 0;

    db.insert(schema.shuAnggota).values({
      id: crypto.randomUUID(),
      shuId,
      anggotaId: a.id,
      jma: String(Math.floor(jma)),
      jua: "0",
      total: String(Math.floor(jma)),
      simpananAnggota: String(simpananAnggota),
      transaksiAnggota: "0",
      status: "belum_dibagikan",
    }).run();
  }

  console.log(`SHU 2025: pendapatan=${totalPendapatan}, biaya=${totalBiaya}, shu=${totalShu}`);
  console.log(`${anggota.length} SHU anggota entries created`);
}
