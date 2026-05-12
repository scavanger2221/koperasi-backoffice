import { z } from "zod";

export const simpananSchema = z.object({
  anggotaId: z.string().uuid("ID anggota tidak valid"),
  jenis: z.enum(["pokok", "wajib", "sukarela", "deposito"]),
  jumlah: z.string().regex(/^\d+(\.\d{1,2})?$/, "Jumlah tidak valid"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  metodeBayar: z.enum(["tunai", "transfer", "qris"]).default("tunai"),
  keterangan: z.string().nullish().default(null),
});

export type SimpananInput = z.infer<typeof simpananSchema>;
