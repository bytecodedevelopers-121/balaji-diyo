import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/animation/MotionProvider";
import { ScrollRestoration } from "@/components/layout/ScrollRestoration";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { getFooterNavData } from "@/features/navigation/lib/build-navigation";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { FOOTER_DEFAULTS, type FooterContent } from "@/features/page-content/footer-defaults";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { siteConfig } from "@/config/site";
import { publicEnv } from "@/lib/env";
import { buildMetadata } from "@/lib/seo/metadata";
import { playfairDisplay, poppins, raleway } from "@/lib/fonts";
import {
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  ...buildMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: "/",
  }),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  manifest: "/site.webmanifest",
  // Same favicon set as the admin panel (frontend-admin/public/*, its own
  // index.html <link> tags) — the real brand mark (the same mountain-peak
  // mark as components/ui/Logo.tsx's logo-mark.svg), not the placeholder
  // dark-square "B" this file used before (app/icon.svg + public/icons/
  // icon.svg, both removed 2026-08-26 now that real assets exist).
  // Joyful Trekking circular logo. The `?v=2` query busts browsers' sticky
  // favicon cache after the swap — bump it when the icon changes again.
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Independent requests — run in parallel instead of one-after-another so
  // this layout (rendered on every route) doesn't serialize two API round
  // trips before it can return any HTML.
  const [{ footerColumns }, settings, footerSections] = await Promise.all([
    getFooterNavData(),
    getSiteSettings(),
    getPageSections("footer"),
  ]);
  const footerContent: FooterContent = {
    newsletter: resolveSection(footerSections, "newsletter", FOOTER_DEFAULTS.newsletter).content,
    columns: resolveSection(footerSections, "columns", FOOTER_DEFAULTS.columns).content,
    brand: resolveSection(footerSections, "brand", FOOTER_DEFAULTS.brand).content,
    social: resolveSection(footerSections, "social", FOOTER_DEFAULTS.social).content,
    payments: resolveSection(footerSections, "payments", FOOTER_DEFAULTS.payments).content,
    legal: resolveSection(footerSections, "legal", FOOTER_DEFAULTS.legal).content,
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${raleway.variable} ${poppins.variable} ${playfairDisplay.variable}`}
    >
      <head>
        {/* No-flash contract for scroll reveals: mark <html class="js"> before
            first paint so `.reveal` elements start hidden (see globals.css).
            If the motion layer hasn't initialised within 3s (script error,
            blocked JS), drop the class so nothing stays hidden. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__motionReady)document.documentElement.classList.remove('js')},3000);",
          }}
        />
        {/* Photos from the API's /files/public/** host are rendered via
            next/image, which fetches them server-side through
            /_next/image (same origin as the page), so the browser no
            longer needs a separate connection to the API host for them.
            This preconnect only still helps the remaining plain <img>
            tags that point there directly; drop it once those are all
            migrated. No `crossOrigin` — that would negotiate a separate
            CORS connection Chrome wouldn't reuse for plain image
            requests. */}
        <link rel="preconnect" href={new URL(publicEnv.NEXT_PUBLIC_API_URL).origin} />
      </head>
      <body className="flex min-h-screen flex-col bg-site-bg font-sans text-neutral-900 antialiased">
        <ScrollRestoration />
        <MotionProvider />
        {/* Root-level structured data. Page-specific JSON-LD (e.g. a trip's
            TouristTrip schema) belongs in that route's own page.tsx. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(websiteJsonLd()),
          }}
        />
        {/* Header + PageContainer moved to the (home)/(pages) route-group
            layouts — each picks its own Header variant. `{children}` here
            is that group layout's rendered output. Footer doesn't vary,
            so it stays global, here. */}
        {children}
        <Footer
          footerColumns={footerColumns}
          siteName={settings.companyName}
          socialLinks={settings.socialLinks}
          siteSettings={settings}
          content={footerContent}
        />
        {/* Was mounted per-page (BookingTermsSection, WhyBoundlessSection,
            BlogDetailSection each carried their own copy) — moved here
            2026-08-27 so every page gets it consistently (About Us, Team,
            etc. were missing it purely because nothing had mounted it on
            them, not by design) instead of needing it added section-by-
            section. */}
        <WhatsAppButton />
        <ScrollToTopButton />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
