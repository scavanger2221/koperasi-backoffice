import { Hono } from "hono";
import { shuController } from "../controllers/shu.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const shuRoute = new Hono()
  .use(authMiddleware)
  .get("/", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), shuController.list)
  .get("/:id", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), shuController.getById)
  .post("/hitung", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("HITUNG_SHU", "shu"), shuController.hitung)
  .patch("/:id/konfirmasi", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("KONFIRMASI_SHU", "shu"), shuController.konfirmasi)
  .patch("/:id/sahkan", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("SAHKAN_SHU", "shu"), shuController.sahkan)
  .patch("/:id/bagikan", requireRole(["super_admin", "admin", "bendahara"]), auditMiddleware("BAGIKAN_SHU", "shu"), shuController.bagikan)
  .delete("/:id", requireRole(["super_admin", "admin"]), auditMiddleware("HAPUS_SHU", "shu"), shuController.hapus)

  // Export
  .get("/export/xlsx", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), shuController.exportRekapXLSX)
  .get("/:id/export/xlsx", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), shuController.exportDetailXLSX)
  .get("/:id/export/pdf", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), shuController.exportDetailPDF);
