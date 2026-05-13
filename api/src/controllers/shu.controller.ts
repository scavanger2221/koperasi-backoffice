import type { Context } from "hono";
import { shuService } from "../services/shu.service.js";

export const shuController = {
  async list(c: Context) {
    const result = await shuService.list();
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await shuService.getById(id);
    return c.json({ success: true, data: result });
  },

  async hitung(c: Context) {
    const { periode } = await c.req.json();
    const result = await shuService.hitung(periode);
    return c.json({ success: true, data: result }, 201);
  },

  async konfirmasi(c: Context) {
    const id = c.req.param("id")!;
    const result = await shuService.konfirmasi(id);
    return c.json({ success: true, data: result });
  },

  async sahkan(c: Context) {
    const id = c.req.param("id")!;
    const result = await shuService.sahkan(id);
    return c.json({ success: true, data: result });
  },

  async bagikan(c: Context) {
    const id = c.req.param("id")!;
    const result = await shuService.bagikan(id);
    return c.json({ success: true, data: result });
  },

  async hapus(c: Context) {
    const id = c.req.param("id")!;
    const result = await shuService.hapus(id);
    return c.json({ success: true, data: result });
  },
};
