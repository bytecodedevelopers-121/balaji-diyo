import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js), mounted globally in the root layout.
 *
 * Renders nothing at all when `NEXT_PUBLIC_GA_MEASUREMENT_ID` isn't set —
 * same "degrades cleanly when unconfigured" shape as Captcha.tsx's
 * Turnstile site key — so a deploy without a measurement ID configured
 * just doesn't load analytics, rather than shipping a broken gtag call.
 * Read directly via `process.env.NEXT_PUBLIC_*` rather than through
 * src/lib/env.ts, same as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` elsewhere —
 * that module is server-only and this value is needed at the page-load
 * script tag, which is the one place a public env var can be read from
 * inside a Server Component without going through it.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
