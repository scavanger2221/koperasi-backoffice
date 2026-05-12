import { Hono } from "hono";
import { jurnalController } from "../controllers/jurnal.controller.js";
import { authMiddleware } from "../middleware/auth.js";

export const jurnalRoute = new Hono()
  .use(authMiddleware)
  .get("/", jurnalController.list)
  .get("/buku-kas", jurnalController.bukuKas);
