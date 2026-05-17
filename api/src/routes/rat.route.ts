import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ratController } from "../controllers/rat.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";
import {
  ratSchema,
  ratUpdateSchema,
  ratAgendaSchema,
  ratVotingSchema,
  ratBulkKehadiranSchema,
  ratGenerateLaporanSchema,
  ratPerpanjangSchema,
  ratCloneSchema,
} from "@koperasi/shared/schemas";

export const ratRoute = new Hono()
  .use(authMiddleware)
  // List & detail
  .get("/", requireRole(["super_admin", "admin", "pengurus", "bendahara", "pengawas", "anggota"]), ratController.list)
  // Anggota aktif (for kehadiran form) — must be BEFORE /:id
  .get("/anggota-aktif", requireRole(["super_admin", "admin", "pengurus"]), ratController.getAnggotaAktif)
  .get("/:id", requireRole(["super_admin", "admin", "pengurus", "bendahara", "pengawas", "anggota"]), ratController.getById)
  // CRUD
  .post("/", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratSchema), auditMiddleware("BUAT_RAT", "rat"), ratController.buat)
  .patch("/:id", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratUpdateSchema), auditMiddleware("UPDATE_RAT", "rat"), ratController.update)
  .delete("/:id", requireRole(["super_admin", "admin"]), auditMiddleware("HAPUS_RAT", "rat"), ratController.hapus)
  // State machine transitions
  .patch("/:id/publikasi", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("PUBLIKASI_RAT", "rat"), ratController.publikasi)
  .patch("/:id/mulai-voting", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("MULAI_VOTING_RAT", "rat"), ratController.mulaiVoting)
  .patch("/:id/sahkan", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("SAHKAN_RAT", "rat"), ratController.sahkan)
  .patch("/:id/perpanjang", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratPerpanjangSchema), auditMiddleware("PERPANJANG_RAT", "rat"), ratController.perpanjang)
  .post("/:id/clone", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratCloneSchema), auditMiddleware("CLONE_RAT", "rat"), ratController.cloneRat)
  // Agenda management
  .post("/:id/agenda", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratAgendaSchema), auditMiddleware("TAMBAH_AGENDA_RAT", "rat"), ratController.addAgenda)
  .delete("/:id/agenda/:agendaId", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("HAPUS_AGENDA_RAT", "rat"), ratController.hapusAgenda)
  .patch("/:id/vote-agenda", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratVotingSchema), auditMiddleware("VOTE_AGENDA_RAT", "rat"), ratController.voteAgenda)
  // Kehadiran
  .post("/:id/kehadiran", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratBulkKehadiranSchema), auditMiddleware("CATAT_KAHADIRAN_RAT", "rat"), ratController.catatKehadiran)
  // Dokumen
  .post("/:id/generate-laporan", requireRole(["super_admin", "admin", "pengurus"]), zValidator("json", ratGenerateLaporanSchema), auditMiddleware("GENERATE_LAPORAN_RAT", "rat"), ratController.generateLaporan)
  .get("/:id/dokumen/:dokId", requireRole(["super_admin", "admin", "pengurus", "bendahara", "pengawas", "anggota"]), ratController.getDokumen);
