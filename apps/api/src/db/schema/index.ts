// Barrel re-export of all Drizzle tables. Populated in Phase 3.
// Keeping the module present now lets `toDrizzle(sqlite)` pass `{ schema }`
// without a per-phase signature change.
export const schema = {} as const;
