import { z } from "zod";

export const shuSchema = z.object({
  periode: z.string().regex(/^\d{4}$/, "Format periode: YYYY"),
  alokasiAnggota: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("40"),
  alokasiCadangan: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("20"),
  alokasiPengurus: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("10"),
  alokasiPendidikan: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("5"),
  alokasiSosial: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("5"),
  alokasiLain: z.string().regex(/^\d+(\.\d{1,2})?$/, "Persen tidak valid").default("20"),
  keterangan: z.string().optional(),
});

export const shuHitungSchema = z.object({
  periode: z.string().regex(/^\d{4}$/, "Format periode: YYYY"),
});

export type ShuInput = z.infer<typeof shuSchema>;
export type ShuHitungInput = z.infer<typeof shuHitungSchema>;

// Response types
export interface ShuItem {
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

export interface ShuAnggotaItem {
  id: string;
  shuId: string;
  anggotaId: string;
  jma: string;
  jua: string;
  total: string;
  simpananAnggota: string;
  transaksiAnggota: string;
  status: "belum_dibagikan" | "dibagikan";
  anggota?: {
    nama: string;
    noAnggota: string;
  };
}

export interface ShuDetail extends ShuItem {
  anggotaList: ShuAnggotaItem[];
}
