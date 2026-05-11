import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { pinjamanSchema, angsuranSchema } from "@koperasi/shared/schemas";
import { pinjamanController } from "../controllers/pinjaman.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const pinjamanRoute = new Hono()
  .use(authMiddleware)
  .get("/", pinjamanController.list)
  .get("/:id", pinjamanController.getById)
  .post("/", zValidator("json", pinjamanSchema), pinjamanController.ajukan)
  .patch("/:id/approve", requireRole(["admin", "pengurus"]), pinjamanController.approve)
  .patch("/:id/cair", requireRole(["admin", "bendahara", "pengurus"]), pinjamanController.cairkan)
  .post("/bayar", zValidator("json", angsuranSchema), pinjamanController.bayarAngsuran);
