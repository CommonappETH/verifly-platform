import { join } from "node:path";
import type { Clock, Ctx } from "../ports";
import { createLocalDb } from "./db";
import { createLocalEmail } from "./email";
import { createLocalSessionStore } from "./sessions";
import { createLocalSecrets, loadEnv, type ValidatedEnv } from "./secrets";
import { createLocalStorage, ensureStorageDir } from "./storage";

export interface LocalContextDeps {
  env?: ValidatedEnv;
  clock?: Clock;
}

interface Singletons {
  env: ValidatedEnv;
  ctxPartial: Omit<Ctx, "requestId">;
}

let singletons: Singletons | null = null;

function initSingletons(deps: LocalContextDeps = {}): Singletons {
  if (singletons) return singletons;
  const env = deps.env ?? loadEnv();
  const clock: Clock = deps.clock ?? { now: () => Date.now() };

  const { port: dbPort } = createLocalDb(env.DATABASE_URL);
  const secrets = createLocalSecrets(env);
  const sessions = createLocalSessionStore(dbPort, clock);
  const storage = createLocalStorage(
    {
      rootDir: env.STORAGE_DIR,
      pepper: env.SESSION_PEPPER,
      publicBaseUrl: `http://localhost:${env.PORT}`,
    },
    clock,
  );
  const email = createLocalEmail({
    outboxDir: join(".data", "outbox"),
    env: env.APP_ENV,
  });

  void ensureStorageDir(env.STORAGE_DIR);

  singletons = {
    env,
    ctxPartial: {
      db: dbPort,
      sessions,
      storage,
      email,
      secrets,
      clock,
      env: env.APP_ENV,
    },
  };
  return singletons;
}

export function resetLocalContext(): void {
  singletons = null;
}

export function createLocalContext(params: { requestId: string; deps?: LocalContextDeps }): Ctx {
  const { ctxPartial } = initSingletons(params.deps);
  return { ...ctxPartial, requestId: params.requestId };
}
