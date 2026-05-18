import type { Context } from "hono";
import { ratService } from "../services/rat.service.js";

export const ratController = {
  async list(c: Context) {
    const result = await ratService.list();
    return c.json({ success: true, ...result });
  },

  async getById(c: Context) {
    const id = c.req.param("id")!;
    const result = await ratService.getById(id);
    return c.json({ success: true, data: result });
  },

  async buat(c: Context) {
    const body = await c.req.json();
    const result = await ratService.buat(body);
    return c.json({ success: true, data: result }, 201);
  },

  async update(c: Context) {
    const id = c.req.param("id")!;
    const body = await c.req.json();
    const result = await ratService.update(id, body);
    return c.json({ success: true, data: result });
  },

  async publikasi(c: Context) {
    const id = c.req.param("id")!;
    const result = await ratService.publikasi(id);
    return c.json({ success: true, data: result });
  },

  async mulaiVoting(c: Context) {
    const id = c.req.param("id")!;
    const result = await ratService.mulaiVoting(id);
    return c.json({ success: true, data: result });
  },

  async sahkan(c: Context) {
    const id = c.req.param("id")!;
    const result = await ratService.sahkan(id);
    return c.json({ success: true, data: result });
  },

  async perpanjang(c: Context) {
    const id = c.req.param("id")!;
    const { catatan } = await c.req.json();
    const result = await ratService.perpanjang(id, catatan);
    return c.json({ success: true, data: result });
  },

  async cloneRat(c: Context) {
    const id = c.req.param("id")!;
    const { catatan } = await c.req.json();
    const result = await ratService.cloneRat(id, catatan);
    return c.json({ success: true, data: result }, 201);
  },

  async hapus(c: Context) {
    const id = c.req.param("id")!;
    const result = await ratService.hapus(id);
    return c.json({ success: true, data: result });
  },

  async addAgenda(c: Context) {
    const id = c.req.param("id")!;
    const { judul } = await c.req.json();
    const result = await ratService.addAgenda(id, judul);
    return c.json({ success: true, data: result }, 201);
  },

  async hapusAgenda(c: Context) {
    const id = c.req.param("id")!;
    const agendaId = c.req.param("agendaId")!;
    const result = await ratService.hapusAgenda(id, agendaId);
    return c.json({ success: true, data: result });
  },

  async voteAgenda(c: Context) {
    const id = c.req.param("id")!;
    const { agendaId, hasil, suaraSetuju, suaraTolak, suaraDitunda, catatan } = await c.req.json();
    const result = await ratService.voteAgenda(id, agendaId, hasil, suaraSetuju, suaraTolak, suaraDitunda, catatan);
    return c.json({ success: true, data: result });
  },

  async catatKehadiran(c: Context) {
    const id = c.req.param("id")!;
    const { kehadiran } = await c.req.json();
    const result = await ratService.catatKehadiran(id, kehadiran);
    return c.json({ success: true, data: result });
  },

  async generateLaporan(c: Context) {
    const id = c.req.param("id")!;
    const { tipe } = await c.req.json();
    const result = await ratService.generateLaporan(id, tipe);
    return c.json({ success: true, data: result });
  },

  async getDokumen(c: Context) {
    const id = c.req.param("id")!;
    const dokId = c.req.param("dokId")!;
    const result = await ratService.getDokumen(id, dokId);
    return c.json({ success: true, data: result });
  },

  async getAnggotaAktif(c: Context) {
    const result = await ratService.getAnggotaAktif();
    return c.json({ success: true, ...result });
  },

  // ── Export ──
  async exportXLSX(c: Context) {
    const id = c.req.param("id")!;
    const buffer = await ratService.exportXLSX(id);
    const uint8 = new Uint8Array(buffer);
    c.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    c.header("Content-Disposition", `attachment; filename=rat-${id}.xlsx`);
    return c.newResponse(uint8, 200);
  },

  async exportPDF(c: Context) {
    const id = c.req.param("id")!;
    const buffer = await ratService.exportPDF(id);
    const uint8 = new Uint8Array(buffer);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `attachment; filename=rat-${id}.pdf`);
    return c.newResponse(uint8, 200);
  },
};
