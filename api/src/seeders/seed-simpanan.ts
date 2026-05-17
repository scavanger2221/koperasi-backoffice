import crypto from "crypto";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../../database/schema/index.js";

export async function seedSimpanan(db: BetterSQLite3Database<typeof schema>) {
  const budi = db.select().from(schema.anggota).where(eq(schema.anggota.noAnggota, "AG00001")).get();
  const siti = db.select().from(schema.anggota).where(eq(schema.anggota.noAnggota, "AG00002")).get();

  if (!budi || !siti) {
    console.log("anggota not found — run seed-anggota first, skipping");
    return;
  }

  const existing = db.select().from(schema.simpanan).limit(1).all();
  if (existing.length > 0) {
    console.log("simpanan already exist, skipping");
    return;
  }

  db.insert(schema.simpanan).values([
    { id: crypto.randomUUID(), anggotaId: budi.id, jenis: "pokok", jumlah: "100000", tanggal: "2025-01-15", metodeBayar: "tunai" },
    { id: crypto.randomUUID(), anggotaId: budi.id, jenis: "wajib", jumlah: "50000", tanggal: "2025-02-01", metodeBayar: "tunai" },
    { id: crypto.randomUUID(), anggotaId: siti.id, jenis: "pokok", jumlah: "100000", tanggal: "2025-01-20", metodeBayar: "transfer" },
  ]).run();

  console.log("3 simpanan created");
}
