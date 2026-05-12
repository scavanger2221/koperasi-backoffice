import { Hono } from "hono";
import { auditController } from "../controllers/audit.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const auditRoute = new Hono()
  .use(authMiddleware)
  .use(requireRole(["admin", "pengurus", "pengawas"]))
  .get("/", auditController.list);
