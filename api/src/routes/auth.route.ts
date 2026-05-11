import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "@koperasi/shared/schemas";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoute = new Hono()
  .post("/login", zValidator("json", loginSchema), authController.login)
  .post("/register", zValidator("json", registerSchema), authController.register)
  .get("/me", authMiddleware, authController.me);
