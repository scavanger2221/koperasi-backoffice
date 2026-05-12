import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { simpananSchema } from "@koperasi/shared/schemas";
import { simpananController } from "../controllers/simpanan.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const simpananRoute = new Hono()
  .use(authMiddleware)
  .get("/", simpananController.list)
  .get("/saldo/:anggotaId", simpananController.getSaldo)
  .post("/", zValidator("json", simpananSchema), requireRole(["admin", "bendahara", "pengurus"]), auditMiddleware("CREATE_SIMPANAN", "simpanan"), simpananController.create);
