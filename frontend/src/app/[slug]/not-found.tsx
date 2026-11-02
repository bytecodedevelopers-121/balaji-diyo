import { NotFoundContent } from "@/components/sections/NotFoundContent";

/**
 * Same fix as `(pages)/not-found.tsx` (see its comment) for this route's
 * own `notFound()` call in page.tsx — `[slug]/layout.tsx` already renders
 * a Header around `{children}`, so without this file the fallback to
 * root `app/not-found.tsx` stacked a second one on top of it.
 */
export default function SlugNotFound() {
  return <NotFoundContent />;
}
