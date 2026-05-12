import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { anggotaSchema, anggotaUpdateSchema } from "@koperasi/shared/schemas";
import { anggotaController } from "../controllers/anggota.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const anggotaRoute = new Hono()
  .use(authMiddleware)
  .get("/", anggotaController.list)
  .get("/:id", anggotaController.getById)
  .post("/", zValidator("json", anggotaSchema), requireRole(["admin", "pengurus", "bendahara"]), anggotaController.create)
  .patch("/:id/activate", requireRole(["admin", "pengurus"]), anggotaController.activate)
  .patch("/:id/deactivate", requireRole(["admin", "pengurus"]), anggotaController.deactivate)
  .patch("/:id", zValidator("json", anggotaUpdateSchema), requireRole(["admin", "pengurus"]), anggotaController.update)
  .delete("/:id", requireRole(["admin", "pengurus"]), anggotaController.deactivate);
