import type { Context } from "hono";
import { authService } from "../services/auth.service.js";
import type { AuthContext } from "../middleware/auth.js";

export const authController = {
  async login(c: Context) {
    const body = await c.req.json();
    const result = await authService.login(body);
    return c.json({ success: true, data: result });
  },

  async register(c: Context) {
    const body = await c.req.json();
    const result = await authService.register(body);
    return c.json({ success: true, data: result });
  },

  async me(c: Context) {
    const user = c.get("user" as any) as AuthContext["user"];
    const result = await authService.me(user.id);
    return c.json({ success: true, data: result });
  },
};
