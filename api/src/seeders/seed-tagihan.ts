import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedTagihan(db: BetterSQLite3Database<typeof schema>) {
  const anggota = db.select().from(schema.anggota).all();
  if (anggota.length === 0) {
    console.log("no anggota found, skipping");
    return;
  }

  const existing = db.select().from(schema.tagihanSimpanan).limit(1).all();
  if (existing.length > 0) {
    console.log("tagihan already exist, skipping");
    return;
  }

  const periode = "2026-05";
  let count = 0;
  for (const a of anggota) {
    db.insert(schema.tagihanSimpanan).values({
      id: crypto.randomUUID(),
      anggotaId: a.id,
      periode,
      jenis: "wajib",
      jumlah: "50000",
      status: "belum_bayar",
    }).run();
    count++;
  }

  console.log(`${count} tagihan created for periode ${periode}`);
}
