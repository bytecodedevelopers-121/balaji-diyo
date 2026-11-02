import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/**
 * The actual "404 / Page not found" message + CTA, split out of
 * app/not-found.tsx so route-specific `not-found.tsx` files (added under
 * `(pages)/` and `[slug]/`) can reuse it without each one re-declaring
 * the copy. Deliberately excludes `<Header>` — every caller either sits
 * directly under the root layout (root `not-found.tsx`, which still adds
 * its own Header) or under a route-group layout that already renders one
 * (see that layout's own doc comment); rendering it here too is exactly
 * the double-navbar bug this split fixes.
 */
export function NotFoundContent() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-helper-m font-medium uppercase tracking-wide text-neutral-500">
        404
      </p>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Page not found
      </h1>
      <p className="max-w-md text-neutral-600">
        We couldn&apos;t find the page you were looking for. It may have
        moved or no longer exists.
      </p>
      <Button href="/">Return home</Button>
    </Container>
  );
}
