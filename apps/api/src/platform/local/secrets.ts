import { z } from "zod";
import type { AppEnv, SecretsPort } from "../ports";

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "test", "prod"]).default("dev"),
  PORT: z.string().default("8787"),
  DATABASE_URL: z.string().default("file:./.data/verifly-dev.sqlite"),
  SESSION_PEPPER: z.string().min(16).default("dev-pepper-change-me-dev-pepper-change-me"),
  COOKIE_DOMAIN: z.string().default("localhost"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  STORAGE_DIR: z.string().default("./.storage"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

let cached: ValidatedEnv | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): ValidatedEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    throw new Error("invalid environment");
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}

export function createLocalSecrets(env: ValidatedEnv = loadEnv()): SecretsPort {
  return {
    get(name: string): string {
      const v = (env as Record<string, unknown>)[name];
      if (typeof v !== "string" || v.length === 0) {
        throw new Error(`missing secret: ${name}`);
      }
      return v;
    },
  };
}

export function appEnvFrom(env: ValidatedEnv): AppEnv {
  return env.APP_ENV;
}
