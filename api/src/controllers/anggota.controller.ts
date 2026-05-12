import type { Context } from "hono";
import { anggotaService } from "../services/anggota.service.js";

export const anggotaController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await anggotaService.list({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      search: query.search || "",
    });
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await anggotaService.getById(id);
    return c.json({ success: true, data: result });
  },

  async create(c: Context) {
    const body = await c.req.json();
    const result = await anggotaService.create(body);
    return c.json({ success: true, data: result }, 201);
  },

  async update(c: Context) {
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const result = await anggotaService.update(id, body);
    return c.json({ success: true, data: result });
  },

  async deactivate(c: Context) {
    const id = c.req.param("id")!;
    const result = await anggotaService.deactivate(id);
    return c.json({ success: true, data: result });
  },

  async activate(c: Context) {
    const id = c.req.param("id")!;
    const result = await anggotaService.activate(id);
    return c.json({ success: true, data: result });
  },
};
