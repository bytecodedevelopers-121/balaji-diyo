// Test-only shim for the `server-only` package. Vitest renders modules in
// a jsdom environment, and `server-only`'s real "browser" build throws on
// import specifically to catch this — but code under test that's provably
// safe to run in Node (no actual secrets touched, e.g. src/lib/seo/*
// pulling in src/config/site.ts -> src/lib/env.ts) still needs to import
// through it. Aliased in vitest.config.ts so those imports no-op instead.
export {};
