import type { Context } from "hono";
import { dashboardService } from "../services/dashboard.service.js";

export const dashboardController = {
  async ringkasan(c: Context) {
    const result = await dashboardService.ringkasan();
    return c.json({ success: true, data: result });
  },

  async simpananPerBulan(c: Context) {
    const result = await dashboardService.simpananPerBulan();
    return c.json({ success: true, data: result });
  },

  async pinjamanStatus(c: Context) {
    const result = await dashboardService.pinjamanStatusCounts();
    return c.json({ success: true, data: result });
  },

  async aktivitas(c: Context) {
    const result = await dashboardService.aktivitasTerakhir();
    return c.json({ success: true, data: result });
  },
};
