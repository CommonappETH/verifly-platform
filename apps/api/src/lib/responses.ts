import type { Context } from "hono";

export const ok = <T>(c: Context, data: T) => c.json({ data }, 200);

export const created = <T>(c: Context, data: T) => c.json({ data }, 201);

export const paginated = <T>(
  c: Context,
  items: T[],
  page: { cursor: string | null; hasMore: boolean },
) => c.json({ data: items, page }, 200);

export const empty = (c: Context) => c.body(null, 204);
