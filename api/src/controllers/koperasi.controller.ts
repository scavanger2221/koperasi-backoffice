import type { Context } from "hono";
import { koperasiService } from "../services/koperasi.service.js";

export const koperasiController = {
  async get(c: Context) {
    const result = await koperasiService.get();
    return c.json({ success: true, data: result });
  },

  async create(c: Context) {
    const body = await c.req.json();
    const result = await koperasiService.create(body);
    return c.json({ success: true, data: result }, 201);
  },

  async update(c: Context) {
    const body = await c.req.json();
    const result = await koperasiService.update(body);
    return c.json({ success: true, data: result });
  },
};
