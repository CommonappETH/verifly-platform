// Phase 10.3: wire→UI mapping seam. Every value returned by `apiClient.*.*`
// passes through a function in this file before reaching components, so a
// wire-shape change in `@verifly/api-client` or `@verifly/types` is absorbed
// in one place instead of rippling through 30 component prop signatures.
//
// Convention: one named function per (entity, view) pair. Mapping functions
// stay pure — no React hooks, no fetching, no side effects. Each per-app
// migration in Phase 10.4 fills this in as it migrates routes.
//
// Starts intentionally empty. Don't add a default re-export — every mapper
// is named so the call site documents which mapping ran.

export {};
