import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "@koperasi/shared/schemas";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { auditMiddleware } from "../middleware/audit.js";

export const userRoute = new Hono()
  .use(authMiddleware)
  .get("/", requireRole(["super_admin", "admin"]), userController.list)
  .get("/:id", requireRole(["super_admin", "admin"]), userController.getById)
  .post("/", requireRole(["super_admin", "admin"]), zValidator("json", createUserSchema), auditMiddleware("CREATE_USER", "user"), userController.create)
  .patch("/:id", requireRole(["super_admin", "admin"]), zValidator("json", updateUserSchema), auditMiddleware("UPDATE_USER", "user"), userController.update)
  .patch("/:id/aktifkan", requireRole(["super_admin", "admin"]), auditMiddleware("ACTIVATE_USER", "user"), userController.activate)
  .delete("/:id", requireRole(["super_admin", "admin"]), auditMiddleware("DEACTIVATE_USER", "user"), userController.deactivate);
