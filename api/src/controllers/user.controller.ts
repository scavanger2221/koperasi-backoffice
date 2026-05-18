import type { Context } from "hono";
import { userService } from "../services/user.service.js";

export const userController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await userService.list({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await userService.getById(id);
    return c.json({ success: true, data: result.data });
  },

  async create(c: Context) {
    const body = await c.req.json();
    const result = await userService.create(body);
    return c.json({ success: true, data: result }, 201);
  },

  async update(c: Context) {
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const result = await userService.update(id, body);
    return c.json({ success: true, data: result });
  },

  async deactivate(c: Context) {
    const id = c.req.param("id")!;
    const result = await userService.deactivate(id);
    return c.json({ success: true, data: result });
  },

  async activate(c: Context) {
    const id = c.req.param("id")!;
    const result = await userService.activate(id);
    return c.json({ success: true, data: result });
  },
};
