import crypto from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import { jurnal, jurnalDetail, akun } from "../../database/schema/index.js";

async function getAkunId(kode: string): Promise<string | null> {
  const a = await db.select().from(akun).where(eq(akun.kode, kode)).get();
  return a?.id ?? null;
}

function generateNoJurnal(tanggal: string): string {
  const d = new Date(tanggal);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `JR${y}${m}${random}`;
}

async function createJurnalEntry({
  tanggal,
  keterangan,
  refTipe,
  refId,
  details,
}: {
  tanggal: string;
  keterangan: string;
  refTipe: string;
  refId?: string;
  details: { akunKode: string; debit: number; kredit: number }[];
}) {
  const jurnalId = crypto.randomUUID();
  const noJurnal = generateNoJurnal(tanggal);

  await db.insert(jurnal).values({
    id: jurnalId,
    tanggal,
    noJurnal,
    keterangan,
    refTipe: refTipe as any,
    refId: refId ?? null,
  });

  for (const d of details) {
    const akunId = await getAkunId(d.akunKode);
    if (!akunId) continue;
    await db.insert(jurnalDetail).values({
      id: crypto.randomUUID(),
      jurnalId,
      akunId,
      debit: String(d.debit),
      kredit: String(d.kredit),
    });
  }

  return { jurnalId, noJurnal };
}

export async function jurnalSimpanan({
  simpananId,
  anggotaNama,
  jenis,
  jumlah,
  tanggal,
  metodeBayar,
}: {
  simpananId: string;
  anggotaNama: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
  metodeBayar: string;
}) {
  const kasKode = metodeBayar === "transfer" ? "1-1100" : "1-1000";
  const simpananKode =
    jenis === "pokok"
      ? "2-1000"
      : jenis === "wajib"
      ? "2-1100"
      : "2-1200";

  return createJurnalEntry({
    tanggal,
    keterangan: `Setoran ${jenis} - ${anggotaNama}`,
    refTipe: "simpanan",
    refId: simpananId,
    details: [
      { akunKode: kasKode, debit: jumlah, kredit: 0 },
      { akunKode: simpananKode, debit: 0, kredit: jumlah },
    ],
  });
}

export async function jurnalPinjamanCair({
  pinjamanId,
  anggotaNama,
  jumlah,
  tanggal,
}: {
  pinjamanId: string;
  anggotaNama: string;
  jumlah: number;
  tanggal: string;
}) {
  return createJurnalEntry({
    tanggal,
    keterangan: `Pencairan pinjaman - ${anggotaNama}`,
    refTipe: "pinjaman",
    refId: pinjamanId,
    details: [
      { akunKode: "1-2000", debit: jumlah, kredit: 0 },
      { akunKode: "1-1000", debit: 0, kredit: jumlah },
    ],
  });
}

export async function jurnalAngsuran({
  angsuranId,
  pinjamanId,
  anggotaNama,
  pokok,
  bunga,
  denda,
  tanggal,
  metodeBayar,
}: {
  angsuranId: string;
  pinjamanId: string;
  anggotaNama: string;
  pokok: number;
  bunga: number;
  denda: number;
  tanggal: string;
  metodeBayar: string;
}) {
  const kasKode = metodeBayar === "transfer" ? "1-1100" : "1-1000";
  const total = pokok + bunga + denda;

  const details = [
    { akunKode: kasKode, debit: total, kredit: 0 },
    { akunKode: "1-2000", debit: 0, kredit: pokok },
    { akunKode: "4-1000", debit: 0, kredit: bunga },
  ];

  if (denda > 0) {
    details.push({ akunKode: "4-3000", debit: 0, kredit: denda });
  }

  return createJurnalEntry({
    tanggal,
    keterangan: `Angsuran pinjaman - ${anggotaNama}`,
    refTipe: "angsuran",
    refId: pinjamanId,
    details,
  });
}

export async function listJurnal({
  page = 1,
  limit = 20,
  tanggalMulai,
  tanggalSelesai,
}: {
  page?: number;
  limit?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}) {
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (tanggalMulai) conditions.push(sql`${jurnal.tanggal} >= ${tanggalMulai}`);
  if (tanggalSelesai) conditions.push(sql`${jurnal.tanggal} <= ${tanggalSelesai}`);
  const where = conditions.length > 0 ? and(...conditions as any) : undefined;

  const data = await db
    .select()
    .from(jurnal)
    .where(where)
    .orderBy(desc(jurnal.tanggal))
    .limit(limit)
    .offset(offset);

  const result = [];
  for (const j of data) {
    const details = await db
      .select({
        id: jurnalDetail.id,
        debit: jurnalDetail.debit,
        kredit: jurnalDetail.kredit,
        akunNama: akun.nama,
        akunKode: akun.kode,
      })
      .from(jurnalDetail)
      .innerJoin(akun, eq(jurnalDetail.akunId, akun.id))
      .where(eq(jurnalDetail.jurnalId, j.id));

    result.push({ ...j, details });
  }

  const total = await db.$count(jurnal, where);
  return { data: result, meta: { page, limit, total } };
}

export async function getBukuKas({
  page = 1,
  limit = 50,
  tanggalMulai,
  tanggalSelesai,
}: {
  page?: number;
  limit?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}) {
  const kasId = await getAkunId("1-1000");
  if (!kasId) return { data: [], meta: { page, limit, total: 0 } };

  const offset = (page - 1) * limit;

  // Build WHERE clause manually for reliability
  let whereClause = `WHERE jd.akun_id = '${kasId}'`;
  if (tanggalMulai && tanggalSelesai) {
    whereClause += ` AND j.tanggal >= '${tanggalMulai}' AND j.tanggal <= '${tanggalSelesai}'`;
  }

  const rows = db.all(sql`
    SELECT j.id, j.tanggal, j.no_jurnal as noJurnal, j.keterangan,
           jd.debit, jd.kredit
    FROM jurnal_detail jd
    INNER JOIN jurnal j ON jd.jurnal_id = j.id
    ${sql.raw(whereClause)}
    ORDER BY j.tanggal DESC, j.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  // Calculate running saldo (reverse order since we DESC)
  const countRow = db.get<{ total: number }>(sql`
    SELECT COUNT(*) as total
    FROM jurnal_detail jd
    INNER JOIN jurnal j ON jd.jurnal_id = j.id
    ${sql.raw(whereClause)}
  `);

  // Need to calculate saldo in chronological order then reverse
  const allRows = db.all<{ id: string; tanggal: string; noJurnal: string; keterangan: string; debit: string; kredit: string }>(sql`
    SELECT j.id, j.tanggal, j.no_jurnal as noJurnal, j.keterangan,
           jd.debit, jd.kredit
    FROM jurnal_detail jd
    INNER JOIN jurnal j ON jd.jurnal_id = j.id
    ${sql.raw(whereClause)}
    ORDER BY j.tanggal ASC, j.created_at ASC
  `);

  let saldo = 0;
  const withSaldo = allRows.map((r) => {
    saldo += Number(r.debit) - Number(r.kredit);
    return { ...r, saldo };
  });

  // Reverse for display (newest first)
  const data = withSaldo.reverse();
  const total = Number(countRow?.total ?? 0);

  return { data, meta: { page, limit, total } };
}
