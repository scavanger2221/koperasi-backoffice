import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    anggotaId: text("anggota_id"),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    nama: text("nama").notNull(),
    role: text("role", { enum: ["super_admin", "admin", "pengurus", "bendahara", "pengawas", "anggota"] }).notNull().default("anggota"),
    aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
    lastLogin: text("last_login"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
});

export const anggota = sqliteTable("anggota", {
    id: text("id").primaryKey(),
    noAnggota: text("no_anggota").notNull().unique(),
    nik: text("nik").notNull().unique(),
    nama: text("nama").notNull(),
    tempatLahir: text("tempat_lahir").notNull(),
    tanggalLahir: text("tanggal_lahir").notNull(),
    alamat: text("alamat").notNull(),
    pekerjaan: text("pekerjaan").notNull(),
    noTelepon: text("no_telepon").notNull(),
    email: text("email"),
    foto: text("foto"),
    status: text("status", { enum: ["menunggu_verifikasi", "aktif", "nonaktif", "ditolak"] }).notNull().default("menunggu_verifikasi"),
    tanggalDaftar: text("tanggal_daftar").default(sql`(date('now'))`).notNull(),
    tanggalKeluar: text("tanggal_keluar"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
});

export const simpanan = sqliteTable("simpanan", {
    id: text("id").primaryKey(),
    anggotaId: text("anggota_id").notNull().references(() => anggota.id),
    jenis: text("jenis", { enum: ["pokok", "wajib", "sukarela", "deposito"] }).notNull(),
    jumlah: text("jumlah").notNull(),
    tanggal: text("tanggal").notNull(),
    metodeBayar: text("metode_bayar", { enum: ["tunai", "transfer", "qris"] }).notNull().default("tunai"),
    keterangan: text("keterangan"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const pinjaman = sqliteTable("pinjaman", {
    id: text("id").primaryKey(),
    anggotaId: text("anggota_id").notNull().references(() => anggota.id),
    noPinjaman: text("no_pinjaman").notNull().unique(),
    jumlah: text("jumlah").notNull(),
    bungaPersen: text("bunga_persen").notNull(),
    jenisBunga: text("jenis_bunga", { enum: ["flat", "efektif", "anuitas", "syariah"] }).notNull().default("flat"),
    jangkaWaktu: integer("jangka_waktu").notNull(),
    angsuranPerBulan: text("angsuran_per_bulan").notNull(),
    status: text("status", { enum: ["diajukan", "disetujui", "aktif", "lunas", "ditolak", "macet"] }).notNull().default("diajukan"),
    tanggalPengajuan: text("tanggal_pengajuan").default(sql`(date('now'))`).notNull(),
    tanggalAcc: text("tanggal_acc"),
    tanggalPencairan: text("tanggal_pencairan"),
    keterangan: text("keterangan"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
});

export const angsuran = sqliteTable("angsuran", {
    id: text("id").primaryKey(),
    pinjamanId: text("pinjaman_id").notNull().references(() => pinjaman.id),
    angsuranKe: integer("angsuran_ke").notNull(),
    tanggalJatuhTempo: text("tanggal_jatuh_tempo").notNull(),
    tanggalBayar: text("tanggal_bayar"),
    jumlahPokok: text("jumlah_pokok").notNull(),
    jumlahBunga: text("jumlah_bunga").notNull(),
    denda: text("denda").notNull().default("0"),
    totalBayar: text("total_bayar").notNull(),
    status: text("status", { enum: ["belum_lunas", "lunas", "telat"] }).notNull().default("belum_lunas"),
    metodeBayar: text("metode_bayar", { enum: ["tunai", "transfer", "qris", "auto_debet"] }),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const akun = sqliteTable("akun", {
    id: text("id").primaryKey(),
    kode: text("kode").notNull().unique(),
    nama: text("nama").notNull(),
    tipe: text("tipe", { enum: ["aset", "kewajiban", "ekuitas", "pendapatan", "biaya"] }).notNull(),
    saldoNormal: text("saldo_normal", { enum: ["debit", "kredit"] }).notNull(),
    aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const jurnal = sqliteTable("jurnal", {
    id: text("id").primaryKey(),
    tanggal: text("tanggal").notNull(),
    noJurnal: text("no_jurnal").notNull(),
    keterangan: text("keterangan").notNull(),
    refTipe: text("ref_tipe", { enum: ["simpanan", "pinjaman", "angsuran", "penjualan", "pembelian", "biaya", "jurnal_umum"] }).notNull(),
    refId: text("ref_id"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const jurnalDetail = sqliteTable("jurnal_detail", {
    id: text("id").primaryKey(),
    jurnalId: text("jurnal_id").notNull().references(() => jurnal.id),
    akunId: text("akun_id").notNull().references(() => akun.id),
    debit: text("debit").notNull().default("0"),
    kredit: text("kredit").notNull().default("0"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const auditLog = sqliteTable("audit_log", {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    userEmail: text("user_email"),
    userRole: text("user_role"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    detail: text("detail"),
    ipAddress: text("ip_address"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const tagihanSimpanan = sqliteTable("tagihan_simpanan", {
    id: text("id").primaryKey(),
    anggotaId: text("anggota_id").notNull().references(() => anggota.id),
    periode: text("periode").notNull(),
    jenis: text("jenis", { enum: ["wajib"] }).notNull().default("wajib"),
    jumlah: text("jumlah").notNull(),
    status: text("status", { enum: ["belum_bayar", "lunas", "tunggakan"] }).notNull().default("belum_bayar"),
    tanggalBayar: text("tanggal_bayar"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const shu = sqliteTable("shu", {
    id: text("id").primaryKey(),
    periode: text("periode").notNull(),
    totalShu: text("total_shu").notNull().default("0"),
    totalPendapatan: text("total_pendapatan").notNull().default("0"),
    totalBiaya: text("total_biaya").notNull().default("0"),
    alokasiAnggota: text("alokasi_anggota").notNull().default("40"),
    alokasiCadangan: text("alokasi_cadangan").notNull().default("20"),
    alokasiPengurus: text("alokasi_pengurus").notNull().default("10"),
    alokasiPendidikan: text("alokasi_pendidikan").notNull().default("5"),
    alokasiSosial: text("alokasi_sosial").notNull().default("5"),
    alokasiLain: text("alokasi_lain").notNull().default("20"),
    danaAnggota: text("dana_anggota").notNull().default("0"),
    danaCadangan: text("dana_cadangan").notNull().default("0"),
    danaPengurus: text("dana_pengurus").notNull().default("0"),
    danaPendidikan: text("dana_pendidikan").notNull().default("0"),
    danaSosial: text("dana_sosial").notNull().default("0"),
    danaLain: text("dana_lain").notNull().default("0"),
    totalSimpanan: text("total_simpanan").notNull().default("0"),
    totalTransaksi: text("total_transaksi").notNull().default("0"),
    status: text("status", { enum: ["draft", "dikonfirmasi", "disahkan", "dibagikan"] }).notNull().default("draft"),
    keterangan: text("keterangan"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
    updatedAt: text("updated_at").default(sql`(datetime('now'))`).$onUpdate(() => sql`(datetime('now'))`).notNull(),
});

export const shuAnggota = sqliteTable("shu_anggota", {
    id: text("id").primaryKey(),
    shuId: text("shu_id").notNull().references(() => shu.id),
    anggotaId: text("anggota_id").notNull().references(() => anggota.id),
    jma: text("jma").notNull().default("0"),
    jua: text("jua").notNull().default("0"),
    total: text("total").notNull().default("0"),
    simpananAnggota: text("simpanan_anggota").notNull().default("0"),
    transaksiAnggota: text("transaksi_anggota").notNull().default("0"),
    status: text("status", { enum: ["belum_dibagikan", "dibagikan"] }).notNull().default("belum_dibagikan"),
    createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
