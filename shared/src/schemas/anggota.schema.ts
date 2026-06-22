import { z } from "zod";

export const anggotaSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  nik: z.string().length(16, "NIK harus 16 digit"),
  tempatLahir: z.string().min(2, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal: YYYY-MM-DD"),
  jenisKelamin: z.enum(["laki_laki", "perempuan"], { message: "Pilih jenis kelamin" }),
  agama: z.string().optional().or(z.literal("")),
  statusKawin: z.enum(["belum_kawin", "kawin", "cerai_hidup", "cerai_mati"]).optional().or(z.literal("")),
  pendidikanTerakhir: z.string().optional().or(z.literal("")),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  pekerjaan: z.string().optional().or(z.literal("")),
  noTelepon: z.string().min(10, "No telepon minimal 10 digit"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

export const anggotaUpdateSchema = anggotaSchema.partial();

export type AnggotaInput = z.infer<typeof anggotaSchema>;
export type AnggotaUpdateInput = z.infer<typeof anggotaUpdateSchema>;
