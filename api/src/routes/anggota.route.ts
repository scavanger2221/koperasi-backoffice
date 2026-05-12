import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { anggotaSchema, anggotaUpdateSchema } from "@koperasi/shared/schemas";
import { anggotaController } from "../controllers/anggota.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const anggotaRoute = new Hono()
  .use(authMiddleware)
  .get("/", anggotaController.list)
  .get("/:id", anggotaController.getById)
  .post("/", zValidator("json", anggotaSchema), requireRole(["admin", "pengurus", "bendahara"]), auditMiddleware("CREATE_ANGGOTA", "anggota"), anggotaController.create)
  .patch("/:id/activate", requireRole(["admin", "pengurus"]), auditMiddleware("ACTIVATE_ANGGOTA", "anggota"), anggotaController.activate)
  .patch("/:id/deactivate", requireRole(["admin", "pengurus"]), auditMiddleware("DEACTIVATE_ANGGOTA", "anggota"), anggotaController.deactivate)
  .patch("/:id", zValidator("json", anggotaUpdateSchema), requireRole(["admin", "pengurus"]), auditMiddleware("UPDATE_ANGGOTA", "anggota"), anggotaController.update)
  .delete("/:id", requireRole(["admin", "pengurus"]), auditMiddleware("DELETE_ANGGOTA", "anggota"), anggotaController.deactivate);
