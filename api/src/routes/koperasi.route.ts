import { Hono } from "hono";
import { koperasiController } from "../controllers/koperasi.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const koperasiRoute = new Hono()
  .use(authMiddleware)
  .get("/", requireRole(["super_admin", "admin", "pengurus", "bendahara", "pengawas"]), koperasiController.get)
  .post("/", requireRole(["super_admin", "admin"]), auditMiddleware("BUAT_KOPERASI", "koperasi"), koperasiController.create)
  .patch("/", requireRole(["super_admin", "admin"]), auditMiddleware("UPDATE_KOPERASI", "koperasi"), koperasiController.update);
