import type { Ctx } from "../platform/ports";

export interface ScanResult {
  isSafe: boolean;
  threat?: string;
}

/**
 * No-op virus scan stub. Phase 11 swaps this for a real scanner
 * (e.g. ClamAV socket or an external API).
 */
export async function scanDocument(_ctx: Ctx, _storageKey: string): Promise<ScanResult> {
  return { isSafe: true };
}
