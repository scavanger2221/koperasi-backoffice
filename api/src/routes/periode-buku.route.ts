import { Hono } from "hono";
import { periodeBukuController } from "../controllers/periode-buku.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const periodeBukuRoute = new Hono()
  .use(authMiddleware)
  .get("/", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), periodeBukuController.list)
  .get("/aktif", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), periodeBukuController.getAktif)
  .get("/:id", requireRole(["super_admin", "admin", "pengurus", "bendahara"]), periodeBukuController.getById)
  .post("/", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("BUAT_PERIODE_BUKU", "periode_buku"), periodeBukuController.create)
  .patch("/:id", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("UPDATE_PERIODE_BUKU", "periode_buku"), periodeBukuController.update)
  .patch("/:id/tutup", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("TUTUP_BUKU", "periode_buku"), periodeBukuController.tutupBuku)
  .patch("/:id/buka", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("BUKA_BUKU", "periode_buku"), periodeBukuController.bukaBuku)
  .delete("/:id", requireRole(["super_admin", "admin", "pengurus"]), auditMiddleware("HAPUS_PERIODE_BUKU", "periode_buku"), periodeBukuController.hapus);
