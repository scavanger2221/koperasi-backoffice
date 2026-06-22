export type UserRole = "super_admin" | "admin" | "pengurus" | "bendahara" | "pengawas" | "anggota";

export interface User {
  id: string;
  anggotaId?: string;
  email: string;
  nama: string;
  role: UserRole;
  aktif: boolean;
}

export interface Anggota {
  id: string;
  noAnggota: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "laki_laki" | "perempuan";
  agama?: string;
  statusKawin?: "belum_kawin" | "kawin" | "cerai_hidup" | "cerai_mati";
  pendidikanTerakhir?: string;
  alamat: string;
  pekerjaan?: string;
  noTelepon: string;
  email?: string;
  foto?: string;
  status: "menunggu_verifikasi" | "aktif" | "nonaktif" | "ditolak";
  tanggalDaftar: string;
  createdAt: string;
}

export interface Simpanan {
  id: string;
  anggotaId: string;
  jenis: "pokok" | "wajib" | "sukarela" | "deposito";
  jumlah: string;
  tanggal: string;
  metodeBayar: "tunai" | "transfer" | "qris";
  keterangan?: string;
  createdAt: string;
}

export interface Pinjaman {
  id: string;
  anggotaId: string;
  noPinjaman: string;
  jumlah: string;
  bungaPersen: string;
  jenisBunga: "flat" | "efektif" | "anuitas" | "syariah";
  jangkaWaktu: number;
  angsuranPerBulan: string;
  status: "diajukan" | "disetujui" | "aktif" | "lunas" | "ditolak" | "macet";
  tanggalPengajuan: string;
  tanggalAcc?: string;
  tanggalPencairan?: string;
  keterangan?: string;
  createdAt: string;
}

export interface Angsuran {
  id: string;
  pinjamanId: string;
  angsuranKe: number;
  tanggalJatuhTempo: string;
  tanggalBayar?: string;
  jumlahPokok: string;
  jumlahBunga: string;
  denda: string;
  totalBayar: string;
  status: "belum_lunas" | "lunas" | "telat";
  createdAt: string;
}

export interface Shu {
  id: string;
  periode: string;
  totalShu: string;
  totalPendapatan: string;
  totalBiaya: string;
  alokasiAnggota: string;
  alokasiCadangan: string;
  alokasiPengurus: string;
  alokasiPendidikan: string;
  alokasiSosial: string;
  alokasiLain: string;
  danaAnggota: string;
  danaCadangan: string;
  danaPengurus: string;
  danaPendidikan: string;
  danaSosial: string;
  danaLain: string;
  totalSimpanan: string;
  totalTransaksi: string;
  status: "draft" | "dikonfirmasi" | "disahkan" | "dibagikan";
  keterangan?: string;
  createdAt: string;
}

export interface ShuAnggota {
  id: string;
  shuId: string;
  anggotaId: string;
  jma: string;
  jua: string;
  total: string;
  simpananAnggota: string;
  transaksiAnggota: string;
  status: "belum_dibagikan" | "dibagikan";
}

export type ShuStatus = "draft" | "dikonfirmasi" | "disahkan" | "dibagikan";

export type RatStatus = "draft" | "dipublikasi" | "voting" | "disahkan" | "diperpanjang";
export type RatAgendaHasil = "setuju" | "ditolak" | "ditunda";
export type RatDokumenTipe = "lpj_pengurus" | "laporan_keuangan" | "laporan_pengawas" | "shu" | "rencana_kerja" | "rapb" | "notulensi" | "lain";

// --- RAT ---
export interface Rat {
  id: string;
  periode: string; // YYYY
  status: RatStatus;
  tanggalRAT: string;
  tempat: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatAgenda {
  id: string;
  ratId: string;
  judul: string;
  hasilVoting?: RatAgendaHasil;
  catatan?: string;
}

export interface RatDokumen {
  id: string;
  ratId: string;
  nama: string;
  tipe: RatDokumenTipe;
  status: "disiapkan" | "final";
  url?: string;
}

export interface RatKehadiran {
  id: string;
  ratId: string;
  anggotaId: string;
  hadir: boolean;
  suratKuasa: boolean;
  anggota?: {
    nama: string;
    noAnggota: string;
  };
}

export interface RatDetail extends Rat {
  agendaList: RatAgenda[];
  dokumenList: RatDokumen[];
  kehadiranList: RatKehadiran[];
  totalAnggota: number;
  totalHadir: number;
  kuorum: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: number;
    message: string;
  };
}
