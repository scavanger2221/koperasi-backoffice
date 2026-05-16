import { z } from "zod";

export const ratSchema = z.object({
  periode: z.string().regex(/^\d{4}$/, "Format periode: YYYY"),
  tanggalRAT: z.string().min(1, "Tanggal RAT wajib diisi"),
  tempat: z.string().min(3, "Tempat wajib diisi minimal 3 karakter"),
  catatan: z.string().optional(),
});

export const ratUpdateSchema = z.object({
  tanggalRAT: z.string().optional(),
  tempat: z.string().min(3, "Tempat wajib diisi minimal 3 karakter").optional(),
  catatan: z.string().optional(),
});

export const ratAgendaSchema = z.object({
  judul: z.string().min(3, "Judul agenda wajib diisi minimal 3 karakter"),
});

export const ratVotingSchema = z.object({
  agendaId: z.string().min(1, "Agenda ID wajib diisi"),
  hasil: z.enum(["setuju", "ditolak", "ditunda"]),
  catatan: z.string().optional(),
});

export const ratKehadiranSchema = z.object({
  anggotaId: z.string().min(1, "Anggota ID wajib diisi"),
  hadir: z.boolean(),
  suratKuasa: z.boolean().default(false),
});

export const ratBulkKehadiranSchema = z.object({
  kehadiran: z.array(ratKehadiranSchema).min(1, "Minimal 1 data kehadiran"),
});

export type RatInput = z.infer<typeof ratSchema>;
export type RatUpdateInput = z.infer<typeof ratUpdateSchema>;
export type RatAgendaInput = z.infer<typeof ratAgendaSchema>;
export type RatVotingInput = z.infer<typeof ratVotingSchema>;
export type RatKehadiranInput = z.infer<typeof ratKehadiranSchema>;
