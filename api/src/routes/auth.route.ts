import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema, changePasswordSchema } from "@koperasi/shared/schemas";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoute = new Hono()
  .post("/login", zValidator("json", loginSchema), authController.login)
  .post("/register", zValidator("json", registerSchema), authController.register)
  .get("/me", authMiddleware, authController.me)
  .patch("/password", authMiddleware, zValidator("json", changePasswordSchema), authController.changePassword);
