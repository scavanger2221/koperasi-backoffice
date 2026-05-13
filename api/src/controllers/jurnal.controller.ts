import type { Context } from "hono";
import { listJurnal, getBukuKas, getBukuBesar, getNeracaSaldo, getLabaRugi, getNeraca, getArusKas } from "../services/jurnal.service.js";

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

  async bukuBesar(c: Context) {
    const query = c.req.query();
    const akunId = c.req.param("akunId")!;
    const result = await getBukuBesar({
      akunId,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 50,
      tanggalMulai: query.tanggalMulai,
      tanggalSelesai: query.tanggalSelesai,
    });
    return c.json({ success: true, ...result });
  },

  async neracaSaldo(c: Context) {
    const result = await getNeracaSaldo();
    return c.json({ success: true, data: result });
  },

  async labaRugi(c: Context) {
    const query = c.req.query();
    const result = await getLabaRugi({
      tanggalMulai: query.tanggalMulai,
      tanggalSelesai: query.tanggalSelesai,
    });
    return c.json({ success: true, data: result });
  },

  async neraca(c: Context) {
    const result = await getNeraca();
    return c.json({ success: true, data: result });
  },

  async arusKas(c: Context) {
    const query = c.req.query();
    const result = await getArusKas({
      tanggalMulai: query.tanggalMulai,
      tanggalSelesai: query.tanggalSelesai,
    });
    return c.json({ success: true, data: result });
  },
};
