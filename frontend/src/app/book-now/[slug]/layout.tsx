import { PageContainer } from "@/components/layout/PageContainer";

/**
 * Layout for the checkout flow (`/book-now/[slug]`) — deliberately does
 * NOT render the standard site `<Header>`. Figma's "Book Now" frame
 * (node 845:29789) replaces the full nav with a minimal "Secure
 * checkout / SSL encrypted" bar plus a "Back to tour page" link, which
 * this route's own page.tsx renders as page content instead — a
 * checkout page shouldn't offer the full site nav as a way to wander
 * off mid-booking.
 *
 * The root layout's global `<Footer>` still renders after this (see
 * app/layout.tsx's own comment on why Footer stays global); this is an
 * accepted trade-off against Figma's separate minimal checkout footer
 * rather than forking the global layout for one route.
 */
export default function BookNowLayout({ children }: { children: React.ReactNode }) {
  return <PageContainer>{children}</PageContainer>;
}
