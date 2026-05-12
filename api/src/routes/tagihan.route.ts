import { Hono } from "hono";
import { tagihanController } from "../controllers/tagihan.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const tagihanRoute = new Hono()
  .use(authMiddleware)
  .get("/", tagihanController.list)
  .get("/summary", tagihanController.summary)
  .post("/generate", requireRole(["admin", "bendahara", "pengurus"]), auditMiddleware("GENERATE_TAGIHAN", "tagihan"), tagihanController.generate)
  .post("/bayar", requireRole(["admin", "bendahara"]), auditMiddleware("BAYAR_TAGIHAN", "tagihan"), tagihanController.bayar)
  .post("/cek-tunggakan", requireRole(["admin", "bendahara", "pengurus"]), auditMiddleware("CEK_TUNGGAKAN", "tagihan"), tagihanController.cekTunggakan);
