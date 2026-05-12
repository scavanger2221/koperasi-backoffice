import { createMiddleware } from "hono/factory";
import { createAuditLog } from "../services/audit.service.js";
import type { AuthContext } from "./auth.js";

export function auditMiddleware(action: string, entityType?: string) {
  return createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
    await next();

    const user = c.get("user");
    const entityId = c.req.param("id") || undefined;

    await createAuditLog({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action,
      entityType,
      entityId,
      detail: `${c.req.method} ${c.req.path}`,
    });
  });
}
