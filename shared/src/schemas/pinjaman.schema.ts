import { z } from "zod";

export const pinjamanSchema = z.object({
  anggotaId: z.string().uuid("ID anggota tidak valid"),
  jumlah: z.string().regex(/^\d+(\.\d{1,2})?$/, "Jumlah tidak valid"),
  bungaPersen: z.string().regex(/^\d+(\.\d{1,2})?$/, "Bunga tidak valid"),
  jenisBunga: z.enum(["flat", "efektif", "anuitas", "syariah"]).default("flat"),
  jangkaWaktu: z.number().int().min(1).max(60, "Tenor 1-60 bulan"),
  keterangan: z.string().optional(),
});

export const angsuranSchema = z.object({
  pinjamanId: z.string().uuid("ID pinjaman tidak valid"),
  jumlahBayar: z.string().regex(/^\d+(\.\d{1,2})?$/, "Jumlah tidak valid").optional(),
  tanggalBayar: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  metodeBayar: z.enum(["tunai", "transfer", "qris"]).default("tunai"),
});

export type PinjamanInput = z.infer<typeof pinjamanSchema>;
export type AngsuranInput = z.infer<typeof angsuranSchema>;
