import type { Context } from "hono";
import { pinjamanService } from "../services/pinjaman.service.js";

export const pinjamanController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await pinjamanService.list({
      anggotaId: query.anggotaId,
      status: query.status,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await pinjamanService.getById(id);
    return c.json({ success: true, data: result });
  },

  async ajukan(c: Context) {
    const body = await c.req.json();
    const result = await pinjamanService.ajukan(body);
    return c.json({ success: true, data: result }, 201);
  },

  async approve(c: Context) {
    const id = c.req.param("id")!;
    const result = await pinjamanService.approve(id);
    return c.json({ success: true, data: result });
  },

  async cairkan(c: Context) {
    const id = c.req.param("id")!;
    const result = await pinjamanService.cairkan(id);
    return c.json({ success: true, data: result });
  },

  async bayarAngsuran(c: Context) {
    const body = await c.req.json();
    const result = await pinjamanService.bayarAngsuran(body);
    return c.json({ success: true, data: result });
  },
};
