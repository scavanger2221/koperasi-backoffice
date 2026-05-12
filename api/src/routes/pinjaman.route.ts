import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { pinjamanSchema, angsuranSchema } from "@koperasi/shared/schemas";
import { pinjamanController } from "../controllers/pinjaman.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const pinjamanRoute = new Hono()
  .use(authMiddleware)
  .get("/", pinjamanController.list)
  .get("/:id", pinjamanController.getById)
  .get("/:id/kolektibilitas", pinjamanController.kolektibilitas)
  .get("/kolektibilitas/summary", pinjamanController.kolektibilitasSummary)
  .post("/cek-denda", requireRole(["admin", "bendahara", "pengurus"]), pinjamanController.cekDenda)
  .post("/", zValidator("json", pinjamanSchema), auditMiddleware("CREATE_PINJAMAN", "pinjaman"), pinjamanController.ajukan)
  .patch("/:id/approve", requireRole(["admin", "pengurus"]), auditMiddleware("APPROVE_PINJAMAN", "pinjaman"), pinjamanController.approve)
  .patch("/:id/cair", requireRole(["admin", "bendahara", "pengurus"]), auditMiddleware("CAIR_PINJAMAN", "pinjaman"), pinjamanController.cairkan)
  .post("/bayar", zValidator("json", angsuranSchema), auditMiddleware("BAYAR_ANGSURAN", "angsuran"), pinjamanController.bayarAngsuran);
