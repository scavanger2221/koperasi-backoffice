import crypto from "crypto";
import { db } from "../lib/db.js";
import { auditLog } from "../../database/schema/index.js";
import { desc, sql, and } from "drizzle-orm";

export async function createAuditLog({
  userId,
  userEmail,
  userRole,
  action,
  entityType,
  entityId,
  detail,
}: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
}) {
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: userId ?? null,
    userEmail: userEmail ?? null,
    userRole: userRole ?? null,
    action,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
    detail: detail ?? null,
  });
}

export async function listAuditLogs({
  page = 1,
  limit = 50,
  action,
  entityType,
}: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
}) {
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof sql>[] = [];
  if (action) conditions.push(sql`${auditLog.action} = ${action}`);
  if (entityType) conditions.push(sql`${auditLog.entityType} = ${entityType}`);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  const total = await db.$count(auditLog, where);

  return { data, meta: { page, limit, total } };
}
