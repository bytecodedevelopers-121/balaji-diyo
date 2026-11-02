"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces the window to scroll to top the instant a new route commits.
 *
 * Why this exists: `app/loading.tsx` sits at the root segment, so per
 * Next's own docs (file-conventions/loading.md — "loading.js wraps
 * page.js, not-found.js, **and nested layout.js files**") its Suspense
 * boundary wraps the *entire* `[slug]/layout.tsx` subtree during a slow
 * package fetch, not just the page content — the route's own Header
 * disappears too, replaced by the plain loading skeleton in
 * `app/loading.tsx`. That skeleton carries `min-h-screen`/`flex-1` so
 * Footer (rendered by the root layout right after `{children}`) stays
 * pushed below the fold — but only if the viewport is scrolled to the
 * top. Land here from partway down a long page (e.g. a trip listing)
 * and the DOM height still drops to ~100vh for the loading skeleton
 * before Next's own scroll-to-top runs, so for one paint frame the
 * browser shows whatever sits at the *old* scroll offset in the new,
 * much-shorter document — the Footer.
 *
 * `useLayoutEffect` (not `useEffect`) runs synchronously after React
 * commits the new route but before the browser paints, so this reset
 * beats that frame instead of racing it.
 */
export function ScrollRestoration() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
