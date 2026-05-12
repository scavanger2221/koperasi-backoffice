import type { Context } from "hono";
import { listAuditLogs } from "../services/audit.service.js";

export const auditController = {
  async list(c: Context) {
    const query = c.req.query();
    const result = await listAuditLogs({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 50,
      action: query.action,
      entityType: query.entityType,
    });
    return c.json({ success: true, ...result });
  },
};
