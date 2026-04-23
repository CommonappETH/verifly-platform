import type { MiddlewareHandler } from "hono";
import type { ZodTypeAny, z } from "zod";
import { ValidationError } from "./errors";

export type ValidationTarget = "body" | "query" | "params";

export function validate<S extends ZodTypeAny>(
  schema: S,
  target: ValidationTarget,
): MiddlewareHandler {
  return async (c, next) => {
    let raw: unknown;
    if (target === "body") {
      try {
        raw = await c.req.json();
      } catch {
        throw new ValidationError("invalid JSON body");
      }
    } else if (target === "query") {
      raw = c.req.query();
    } else {
      raw = c.req.param();
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError("validation failed", {
        target,
        issues: parsed.error.issues,
      });
    }

    c.set(`validated_${target}` as "validated_body", parsed.data as z.infer<S>);
    await next();
  };
}
