import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: err.status,
          message: err.message,
        },
      },
      err.status
    );
  }

  console.error("[UNEXPECTED ERROR]", err);
  return c.json(
    {
      success: false,
      error: {
        code: 500,
        message: "Terjadi kesalahan internal server",
      },
    },
    500
  );
}
