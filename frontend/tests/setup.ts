import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * @testing-library/react normally unmounts + cleans up the DOM after
 * each test automatically, via an implicit `afterEach` it registers
 * against the test framework's *global* `afterEach`. That only works
 * when the framework exposes globals without an import (Jest does by
 * default); this project runs Vitest with `test.globals` unset (see
 * vitest.config.mts — every test file explicitly imports `describe`/
 * `it`/`expect` from "vitest" instead), so that implicit registration
 * silently never happens and DOM from one test leaks into the next.
 *
 * This went unnoticed because every test file so far only called
 * `render()` once per file. Making it explicit here instead of
 * requiring every test file to remember its own `afterEach(cleanup)`.
 */
afterEach(cleanup);

/**
 * jsdom has no `window.matchMedia` implementation at all — anything
 * that calls it (GSAP's `matchMedia`-based reduced-motion check in
 * Header.tsx, for one) throws outright rather than getting a real
 * (mismatched) answer. This is the standard no-op polyfill: it reports
 * every query as non-matching and implements just enough of the
 * MediaQueryList surface (`addEventListener`/`removeEventListener`,
 * `addListener`/`removeListener` for the deprecated form some libraries
 * still call) that consumers don't also throw wiring up their own
 * listeners on top of it.
 */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
