import type { Context } from "hono";
import { tagihanService } from "../services/tagihan.service.js";

export const tagihanController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await tagihanService.list({
      periode: query.periode,
      status: query.status,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    return c.json({ success: true, ...result });
  },

  async generate(c: Context) {
    const body = await c.req.json();
    const result = await tagihanService.generateTagihan({
      periode: body.periode,
      jumlah: body.jumlah,
    });
    return c.json({ success: true, data: result });
  },

  async bayar(c: Context) {
    const body = await c.req.json();
    const result = await tagihanService.bayarTagihan({
      tagihanId: body.tagihanId,
      tanggalBayar: body.tanggalBayar,
    });
    return c.json({ success: true, data: result });
  },

  async cekTunggakan(c: Context) {
    const result = await tagihanService.cekTunggakan();
    return c.json({ success: true, data: result });
  },

  async summary(c: Context) {
    const query = c.req.query();
    const result = await tagihanService.getSummary(query.periode);
    return c.json({ success: true, data: result });
  },
};
