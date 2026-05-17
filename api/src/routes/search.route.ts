import { Hono } from "hono";
import { searchController } from "../controllers/search.controller.js";
import { authMiddleware } from "../middleware/auth.js";

export const searchRoute = new Hono()
  .use(authMiddleware)
  .get("/", searchController.search);
