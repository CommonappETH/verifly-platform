import type { ErrorHandler } from "hono";
import { AppError } from "../lib/errors";

export const errorHandler = (env: "dev" | "test" | "prod"): ErrorHandler => (err, c) => {
  const requestId = c.get("requestId") as string | undefined;

  if (err instanceof AppError) {
    return c.json(
      {
        error: { code: err.code, message: err.message, details: err.details },
        request_id: requestId,
      },
      err.status as 400 | 401 | 403 | 404 | 409 | 429,
    );
  }

  const payload: Record<string, unknown> = {
    error: { code: "internal_error", message: "Internal Server Error" },
    request_id: requestId,
  };
  if (env !== "prod") {
    (payload.error as Record<string, unknown>).stack = err instanceof Error ? err.stack : String(err);
  }

  console.error(
    JSON.stringify({
      level: "error",
      ts: new Date().toISOString(),
      request_id: requestId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );

  return c.json(payload, 500);
};
