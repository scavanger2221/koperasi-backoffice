import type { Context } from "hono";
import { searchService } from "../services/search.service.js";

export const searchController = {
  async search(c: Context) {
    const q = c.req.query("q") || "";
    const limit = Math.min(Number(c.req.query("limit")) || 12, 50);
    const data = await searchService.search(q, limit);
    return c.json({ success: true, data });
  },
};
