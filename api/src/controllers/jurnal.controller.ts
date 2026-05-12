import type { Context } from "hono";
import { listJurnal, getBukuKas } from "../services/jurnal.service.js";

export const jurnalController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await listJurnal({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      tanggalMulai: query.tanggalMulai,
      tanggalSelesai: query.tanggalSelesai,
    });
    return c.json({ success: true, ...result });
  },

  async bukuKas(c: Context) {
    const query = c.req.query();
    const result = await getBukuKas({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 50,
      tanggalMulai: query.tanggalMulai,
      tanggalSelesai: query.tanggalSelesai,
    });
    return c.json({ success: true, ...result });
  },
};
