import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const dirname = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      // See tests/shims/server-only.ts for why.
      "server-only": path.resolve(dirname, "./tests/shims/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
    ],
    exclude: ["tests/e2e/**", "node_modules/**"],
    // Hermetic defaults so unit/integration tests don't depend on a real
    // .env.local being present (e.g. in CI). Override per-test via
    // `process.env.X = ...` + `vi.resetModules()` + dynamic import.
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      NEXT_PUBLIC_APP_ENV: "development",
      API_URL: "http://localhost:4000",
      REVALIDATION_SECRET: "test-secret",
    },
  },
});
