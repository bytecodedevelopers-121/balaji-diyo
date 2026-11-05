import { Merriweather } from "next/font/google";

/**
 * SITE FONT (2026-11): every family below now loads Merriweather, a sturdy
 * serif matching the "Joyful Trekking" logo lettering (direct request: "make
 * all my fonts style like this"). The three exports keep their old names
 * (`raleway`, `poppins`, `playfairDisplay`) and CSS variables so the
 * `font-raleway` / `font-poppins` / `font-playfair-display` classes used
 * across the site keep working unchanged; to try another family, swap the
 * loader in these three places. The older notes below describe the previous
 * Inter / Poppins / Playfair setup.
 *
 * Font loaders for the Boundless Adventure design-token foundation.
 *
 * The site-wide default family is Inter (Regular, Medium, SemiBold, Bold)
 * — swapped in 2026-09-14 for Raleway (direct client request: "change the
 * font"), which is why the binding/variable/class name below still say
 * `raleway` rather than `inter`. Renaming them would mean touching every
 * `font-raleway` usage across the site (~25 files) plus theme.css's
 * `--text-raleway-*` type-scale tokens, for zero functional difference —
 * so the swap is scoped to *which* font loads here, not what it's called.
 * If Raleway itself is wanted back, this is the only line that needs to
 * change again.
 *
 * Poppins and Playfair Display were sampled from the itinerary/package
 * detail page design (Figma file Ak1b0xbJLdSUXt2TLDMy89, "Boundless
 * Adventure", node 125:117): Poppins (Medium) carries that page's body
 * copy, labels, and most headings; Playfair Display (Medium) is used
 * for a couple of large display headings (the shared "Let's Plan Your
 * Trip Together" CTA and "Similar Packages"). Both are additive to the
 * site-wide foundation, not a replacement — scope them with font-poppins /
 * font-playfair-display rather than changing the global font-sans default.
 *
 * Each font exposes its family via a CSS variable (applied to `<html>`
 * in src/app/layout.tsx) rather than a `className`, so it can be
 * referenced from Tailwind's `@theme inline` block in
 * src/app/theme.css and from plain CSS/inline styles alike.
 */

/** Global family for headings, body copy, inputs, buttons, and helper text. */
export const raleway = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-raleway",
  display: "swap",
});

/**
 * Supporting family used by artwork whose Figma typography specifies
 * Poppins — the itinerary/package-detail page's body + heading copy,
 * plus other components sampled from the same typography.
 *
 * CORRECTED (2026-08-25, direct from the user): the site header's phone
 * number (`Header.tsx`, `MobileNavPanel.tsx`) and the footer's office
 * phone numbers (`Footer.tsx`) are Poppins too, not the Raleway
 * foundation this file's own top comment originally scoped them under —
 * both now carry `font-poppins` explicitly.
 */
export const poppins = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-poppins",
  display: "swap",
  // `preload: false` — all three fonts here are called in the *root*
  // layout (their variables applied to `<html>` in src/app/layout.tsx),
  // which per Next's own font docs means each gets a `<link rel=preload>`
  // injected on *every* route, not just ones that actually render
  // `font-poppins` text. Unlike Inter/`raleway` (the true global
  // default — every page uses it), Poppins is only used by specific
  // page types (itinerary/package-detail, team, ...), so plain pages
  // preloaded a font file nothing on that page ended up using within a
  // few seconds — the real cause of the "resource was preloaded but not
  // used" console warning seen in production. Turning off its own
  // preload stops that false preload on pages that don't use it; pages
  // that do still load and render it via `@font-face`, just without the
  // early preload hint.
  preload: false,
});

/**
 * Large display headings — secondary-page hero titles, and the shared
 * "Let's Plan Your Trip Together" CTA / "Similar Packages" headings on
 * the itinerary/package-detail page.
 */
export const playfairDisplay = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-playfair-display",
  display: "swap",
  // `preload: false` — same reasoning as `poppins` above: not every page
  // renders `font-playfair-display` text, but the root layout preloads
  // it on every route regardless.
  preload: false,
});
