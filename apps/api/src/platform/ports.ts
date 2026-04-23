import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { schema } from "../db/schema";

export type DbHandle = BunSQLiteDatabase<typeof schema>;

export interface DbPort {
  handle(): DbHandle;
}

export interface SessionRecord {
  userId: string;
  createdAt: number;
  ip: string | null;
  userAgent: string | null;
  [key: string]: unknown;
}

export interface SessionStorePort {
  get(key: string): Promise<SessionRecord | null>;
  set(key: string, value: SessionRecord, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

export interface PresignUploadInput {
  key: string;
  mimeType: string;
  maxBytes: number;
  expiresInSec: number;
}

export interface PresignedUpload {
  url: string;
  headers: Record<string, string>;
}

export interface ObjectHead {
  size: number;
  mimeType: string | null;
}

export interface ObjectStoragePort {
  presignUpload(input: PresignUploadInput): Promise<PresignedUpload>;
  presignDownload(key: string, expiresInSec: number): Promise<string>;
  head(key: string): Promise<ObjectHead | null>;
  delete(key: string): Promise<void>;
}

export interface EmailMessage {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}

export interface SecretsPort {
  get(name: string): string;
}

export interface Clock {
  now(): number;
}

export type AppEnv = "dev" | "test" | "prod";

export interface Ctx {
  db: DbPort;
  sessions: SessionStorePort;
  storage: ObjectStoragePort;
  email: EmailPort;
  secrets: SecretsPort;
  clock: Clock;
  env: AppEnv;
  requestId: string;
}
