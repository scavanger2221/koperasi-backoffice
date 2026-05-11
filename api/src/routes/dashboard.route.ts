import { Hono } from "hono";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

export const dashboardRoute = new Hono()
  .use(authMiddleware)
  .use(requireRole(["admin", "pengurus", "bendahara", "pengawas"]))
  .get("/ringkasan", dashboardController.ringkasan)
  .get("/aktivitas", dashboardController.aktivitas);
