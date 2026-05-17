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
    suaraSetuju: z.number().int().min(0).default(0),
    suaraTolak: z.number().int().min(0).default(0),
    suaraDitunda: z.number().int().min(0).default(0),
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
export const ratGenerateLaporanSchema = z.object({
    tipe: z.enum(["lpj_pengurus", "laporan_keuangan", "laporan_pengawas", "shu", "rencana_kerja", "rapb"], {
        message: "Tipe dokumen tidak valid",
    }),
});
export const ratPerpanjangSchema = z.object({
    catatan: z.string().optional(),
});
export const ratCloneSchema = z.object({
    catatan: z.string().optional(),
});
