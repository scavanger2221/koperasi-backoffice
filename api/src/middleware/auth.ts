import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { config } from "../lib/config.js";
import type { UserRole } from "@koperasi/shared/types";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    nama: string;
    role: UserRole;
  };
}

export const authMiddleware = createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Token tidak ditemukan" });
  }

  const token = auth.slice(7);
  try {
    const payload = await verify(token, config.jwtSecret, "HS256");
    c.set("user", payload as AuthContext["user"]);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Token tidak valid atau sudah expired" });
  }
});

export function requireRole(roles: UserRole[]) {
  return createMiddleware<{ Variables: AuthContext }>(async (c, next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Akses ditolak: role tidak memiliki izin" });
    }
    await next();
  });
}
