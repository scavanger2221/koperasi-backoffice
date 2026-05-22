import type { Context } from "hono";
import { shuService } from "../services/shu.service.js";
import { exportService } from "../services/export.service.js";

export const shuController = {
  async list(c: Context) {
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const result = await shuService.list({ page, limit });
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

  // ── Export ──
  async exportRekapXLSX(c: Context) {
    const buffer = await exportService.exportSHURekapXLSX();
    const uint8 = new Uint8Array(buffer);
    c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    c.header("Content-Disposition", "attachment; filename=rekap-shu.xlsx");
    return c.newResponse(uint8, 200);
  },

  async exportDetailXLSX(c: Context) {
    const id = c.req.param("id")!;
    const buffer = await exportService.exportSHUDetailXLSX(id);
    const uint8 = new Uint8Array(buffer);
    c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    c.header("Content-Disposition", `attachment; filename=shu-${id}.xlsx`);
    return c.newResponse(uint8, 200);
  },

  async exportDetailPDF(c: Context) {
    const id = c.req.param("id")!;
    const buffer = await exportService.exportSHUDetailPDF(id);
    const uint8 = new Uint8Array(buffer);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `attachment; filename=shu-${id}.pdf`);
    return c.newResponse(uint8, 200);
  },
};
