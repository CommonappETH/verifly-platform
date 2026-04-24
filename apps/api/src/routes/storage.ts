import { Hono } from "hono";
import { createReadStream } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { AppVariables } from "../app";
import { ValidationError, ForbiddenError } from "../lib/errors";
import {
  resolveStoragePath,
  verifyUploadSignature,
  verifyDownloadSignature,
} from "../platform/local/storage";
import { rateLimit } from "../middleware/rate-limit";

const STORAGE_RATE_LIMIT = rateLimit({
  name: "storage",
  windowMs: 60_000,
  max: 60,
  by: "ip",
});

function extractKeyFromPath(rawPath: string): string {
  const withoutQuery = rawPath.split("?")[0];
  const prefix = "/storage/";
  const idx = withoutQuery.indexOf(prefix);
  if (idx >= 0) {
    return decodeURIComponent(withoutQuery.slice(idx + prefix.length));
  }
  // Sub-router: path has the prefix stripped, starts with "/"
  const trimmed = withoutQuery.startsWith("/") ? withoutQuery.slice(1) : withoutQuery;
  return decodeURIComponent(trimmed);
}

export function createStorageRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.use("*", STORAGE_RATE_LIMIT);

  router.put("/*", async (c) => {
    const ctx = c.get("ctx");
    const key = extractKeyFromPath(c.req.path);
    if (!key) throw new ValidationError("missing storage key");

    const expStr = c.req.query("exp");
    const sig = c.req.query("sig");
    if (!expStr || !sig) throw new ForbiddenError("missing signature parameters");

    const exp = Number(expStr);
    if (Number.isNaN(exp)) throw new ForbiddenError("invalid expiry");

    const contentType = c.req.header("content-type") ?? "";
    const maxBytesStr = c.req.header("x-verifly-max-bytes") ?? "0";
    const maxBytes = Number(maxBytesStr);

    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const now = Math.floor(ctx.clock.now() / 1000);

    const isValid = verifyUploadSignature(pepper, key, exp, contentType, maxBytes, sig, now);
    if (!isValid) throw new ForbiddenError("invalid or expired upload signature");

    const storageDir = ctx.secrets.get("STORAGE_DIR");
    const filePath = resolveStoragePath(storageDir, key);

    const body = await c.req.arrayBuffer();
    if (body.byteLength > maxBytes) {
      throw new ValidationError(`file exceeds max size of ${maxBytes} bytes`);
    }

    await mkdir(dirname(filePath), { recursive: true });
    const tmpPath = filePath + ".tmp";
    await writeFile(tmpPath, Buffer.from(body));
    await rename(tmpPath, filePath);

    return c.json({ ok: true }, 200);
  });

  router.get("/*", async (c) => {
    const ctx = c.get("ctx");
    const key = extractKeyFromPath(c.req.path);
    if (!key) throw new ValidationError("missing storage key");

    const expStr = c.req.query("exp");
    const sig = c.req.query("sig");
    if (!expStr || !sig) throw new ForbiddenError("missing signature parameters");

    const exp = Number(expStr);
    if (Number.isNaN(exp)) throw new ForbiddenError("invalid expiry");

    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const now = Math.floor(ctx.clock.now() / 1000);

    const isValid = verifyDownloadSignature(pepper, key, exp, sig, now);
    if (!isValid) throw new ForbiddenError("invalid or expired download signature");

    const storageDir = ctx.secrets.get("STORAGE_DIR");
    const filePath = resolveStoragePath(storageDir, key);

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      return c.notFound();
    }

    const mimeType = guessMimeType(key);
    const file = Bun.file(filePath);

    c.header("Content-Type", mimeType);
    c.header("Content-Length", String(fileStat.size));
    c.header("Cache-Control", "private, no-cache");

    return c.body(file.stream());
  });

  return router;
}

function guessMimeType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}
