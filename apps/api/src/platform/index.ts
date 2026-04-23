export type {
  AppEnv,
  Clock,
  Ctx,
  DbHandle,
  DbPort,
  EmailMessage,
  EmailPort,
  ObjectHead,
  ObjectStoragePort,
  PresignUploadInput,
  PresignedUpload,
  SecretsPort,
  SessionRecord,
  SessionStorePort,
} from "./ports";

import { createLocalContext } from "./local";
import type { Ctx } from "./ports";

export interface CreateContextParams {
  requestId: string;
}

// Phase 15 will add an `aws` branch here gated on APP_ENV / AWS_REGION.
// For now the local adapter is the only target.
export function createContext(params: CreateContextParams): Ctx {
  return createLocalContext({ requestId: params.requestId });
}
