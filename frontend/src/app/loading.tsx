import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Root loading fallback — this file makes Next.js wrap every route
 * segment's `{children}` in a Suspense boundary, so it stands in during
 * navigation while the next page's Server Component is still fetching
 * data. RootLayout renders `<Footer>` right after `{children}`
 * (layout.tsx), so this fallback's own height determines the footer's
 * position while it's showing — no `min-h-screen` here meant this
 * handful of skeleton lines collapsed to a couple hundred pixels,
 * yanking the footer up to sit almost directly under the header for a
 * moment on every page navigation, then shoving it back down once the
 * real (usually much taller) page content replaced this fallback.
 * `min-h-dvh` (not `min-h-screen`/`100vh`) keeps the footer roughly
 * where it belongs throughout — `dvh` tracks the browser's actual
 * visible viewport, so it doesn't fall short on mobile where the
 * address bar can make a static `100vh` taller than what's really
 * on-screen. Paired with `<ScrollRestoration>` (root layout), which
 * resets scroll to top the instant this fallback (or the real page)
 * commits, so a deep scroll position on the *previous* page can't
 * expose the footer for a frame while this shorter fallback is up.
 */
export default function Loading() {
  return (
    <Container className="min-h-dvh space-y-4 py-16">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </Container>
  );
}
