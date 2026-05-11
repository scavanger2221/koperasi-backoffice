import type { Context } from "hono";
import { simpananService } from "../services/simpanan.service.js";
import type { AuthContext } from "../middleware/auth.js";

export const simpananController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await simpananService.list({
      anggotaId: query.anggotaId,
      jenis: query.jenis,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    return c.json({ success: true, ...result });
  },

  async create(c: Context) {
    const body = await c.req.json();
    const result = await simpananService.create(body);
    return c.json({ success: true, data: result }, 201);
  },

  async getSaldo(c: Context) {
    const user = c.get("user" as any) as AuthContext["user"];
    const anggotaId = c.req.param("anggotaId") || user?.id;
    const result = await simpananService.getSaldo(anggotaId);
    return c.json({ success: true, data: result });
  },
};
