import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type {
  ObjectHead,
  ObjectStoragePort,
  PresignUploadInput,
  PresignedUpload,
} from "../ports";

export interface LocalStorageConfig {
  rootDir: string;
  pepper: string;
  publicBaseUrl: string;
}

const MAX_KEY_LENGTH = 512;

function assertSafeKey(key: string): void {
  if (
    key.length === 0 ||
    key.length > MAX_KEY_LENGTH ||
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\\") ||
    key.includes("\0")
  ) {
    throw new Error(`invalid storage key: ${key}`);
  }
}

export function resolveStoragePath(rootDir: string, key: string): string {
  assertSafeKey(key);
  const root = isAbsolute(rootDir) ? rootDir : resolve(rootDir);
  const full = resolve(join(root, key));
  if (!full.startsWith(root + "/") && full !== root) {
    throw new Error(`path traversal: ${key}`);
  }
  return full;
}

function sign(pepper: string, payload: string): string {
  return createHmac("sha256", pepper).update(payload).digest("hex");
}

function uploadPayload(key: string, exp: number, mimeType: string, maxBytes: number): string {
  return `PUT|${key}|${exp}|${mimeType}|${maxBytes}`;
}

function downloadPayload(key: string, exp: number): string {
  return `GET|${key}|${exp}`;
}

export function verifyUploadSignature(
  pepper: string,
  key: string,
  exp: number,
  mimeType: string,
  maxBytes: number,
  sig: string,
  now: number,
): boolean {
  if (exp <= now) return false;
  const expected = sign(pepper, uploadPayload(key, exp, mimeType, maxBytes));
  return constantTimeEqHex(expected, sig);
}

export function verifyDownloadSignature(
  pepper: string,
  key: string,
  exp: number,
  sig: string,
  now: number,
): boolean {
  if (exp <= now) return false;
  const expected = sign(pepper, downloadPayload(key, exp));
  return constantTimeEqHex(expected, sig);
}

function constantTimeEqHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createLocalStorage(
  cfg: LocalStorageConfig,
  clock: { now(): number },
): ObjectStoragePort {
  return {
    async presignUpload(input: PresignUploadInput): Promise<PresignedUpload> {
      assertSafeKey(input.key);
      const exp = Math.floor(clock.now() / 1000) + input.expiresInSec;
      const sig = sign(cfg.pepper, uploadPayload(input.key, exp, input.mimeType, input.maxBytes));
      const url = `${cfg.publicBaseUrl}/storage/${input.key}?exp=${exp}&sig=${sig}`;
      return {
        url,
        headers: {
          "Content-Type": input.mimeType,
          "X-Verifly-Max-Bytes": String(input.maxBytes),
        },
      };
    },

    async presignDownload(key: string, expiresInSec: number): Promise<string> {
      assertSafeKey(key);
      const exp = Math.floor(clock.now() / 1000) + expiresInSec;
      const sig = sign(cfg.pepper, downloadPayload(key, exp));
      return `${cfg.publicBaseUrl}/storage/${key}?exp=${exp}&sig=${sig}`;
    },

    async head(key: string): Promise<ObjectHead | null> {
      const path = resolveStoragePath(cfg.rootDir, key);
      try {
        const s = await stat(path);
        return { size: s.size, mimeType: null };
      } catch {
        return null;
      }
    },

    async delete(key: string): Promise<void> {
      const path = resolveStoragePath(cfg.rootDir, key);
      await rm(path, { force: true });
    },
  };
}

export async function ensureStorageDir(rootDir: string): Promise<void> {
  await mkdir(rootDir, { recursive: true });
}

export function storageDirFor(filePath: string): string {
  return dirname(filePath);
}
