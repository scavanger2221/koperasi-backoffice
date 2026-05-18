import type { Context } from "hono";
import { periodeBukuService } from "../services/periode-buku.service.js";

export const periodeBukuController = {
  async list(c: Context) {
    const result = await periodeBukuService.list();
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await periodeBukuService.getById(id);
    return c.json({ success: true, data: result });
  },

  async create(c: Context) {
    const body = await c.req.json();
    const result = await periodeBukuService.create(body);
    return c.json({ success: true, data: result }, 201);
  },

  async update(c: Context) {
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const result = await periodeBukuService.update(id, body);
    return c.json({ success: true, data: result });
  },

  async tutupBuku(c: Context) {
    const id = c.req.param("id")!;
    const result = await periodeBukuService.tutupBuku(id);
    return c.json({ success: true, data: result });
  },

  async bukaBuku(c: Context) {
    const id = c.req.param("id")!;
    const result = await periodeBukuService.bukaBuku(id);
    return c.json({ success: true, data: result });
  },

  async hapus(c: Context) {
    const id = c.req.param("id")!;
    const result = await periodeBukuService.hapus(id);
    return c.json({ success: true, data: result });
  },

  async getAktif(c: Context) {
    const result = await periodeBukuService.getAktif();
    return c.json({ success: true, data: result });
  },
};
