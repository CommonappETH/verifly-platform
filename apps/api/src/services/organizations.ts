import { and, desc, eq, like, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { organizations } from "../db/schema";
import type { OrganizationKind } from "../db/enums";
import type { Ctx } from "../platform/ports";

export interface OrganizationRecord {
  id: string;
  kind: OrganizationKind;
  name: string;
  slug: string;
  country: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateOrganizationInput {
  kind: OrganizationKind;
  name: string;
  slug: string;
  country?: string | null;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  country?: string | null;
}

export async function createOrganization(
  ctx: Ctx,
  input: CreateOrganizationInput,
): Promise<OrganizationRecord> {
  const id = nanoid();
  const now = ctx.clock.now();
  const row = {
    id,
    kind: input.kind,
    name: input.name,
    slug: input.slug.toLowerCase(),
    country: input.country ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await ctx.db.handle().insert(organizations).values(row);
  return toRecord(row);
}

export async function findOrganizationById(
  ctx: Ctx,
  id: string,
): Promise<OrganizationRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findOrganizationBySlug(
  ctx: Ctx,
  slug: string,
): Promise<OrganizationRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug.toLowerCase()))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function updateOrganization(
  ctx: Ctx,
  id: string,
  input: UpdateOrganizationInput,
): Promise<OrganizationRecord | null> {
  const now = ctx.clock.now();
  const values: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) values.name = input.name;
  if (input.slug !== undefined) values.slug = input.slug.toLowerCase();
  if (input.country !== undefined) values.country = input.country;

  await ctx.db
    .handle()
    .update(organizations)
    .set(values)
    .where(eq(organizations.id, id));
  return findOrganizationById(ctx, id);
}

export async function listOrganizations(
  ctx: Ctx,
  filters: { kind?: OrganizationKind; cursor?: number; limit?: number; q?: string },
): Promise<{ items: OrganizationRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 20, 100);

  const conditions = [];
  if (filters.kind) conditions.push(eq(organizations.kind, filters.kind));
  if (filters.cursor) conditions.push(lt(organizations.createdAt, filters.cursor));
  if (filters.q) conditions.push(like(organizations.name, `%${filters.q}%`));

  const rows = await ctx.db
    .handle()
    .select()
    .from(organizations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(organizations.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toRecord);
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].createdAt) : null;

  return { items, nextCursor, hasMore };
}

function toRecord(row: typeof organizations.$inferSelect): OrganizationRecord {
  return {
    id: row.id,
    kind: row.kind as OrganizationKind,
    name: row.name,
    slug: row.slug,
    country: row.country,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
