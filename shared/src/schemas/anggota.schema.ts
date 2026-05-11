import { z } from "zod";

export const anggotaSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit"),
  tempatLahir: z.string().min(2, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  pekerjaan: z.string().min(2, "Pekerjaan wajib diisi"),
  noTelepon: z.string().min(10, "No telepon minimal 10 digit"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

export const anggotaUpdateSchema = anggotaSchema.partial();

export type AnggotaInput = z.infer<typeof anggotaSchema>;
export type AnggotaUpdateInput = z.infer<typeof anggotaUpdateSchema>;
