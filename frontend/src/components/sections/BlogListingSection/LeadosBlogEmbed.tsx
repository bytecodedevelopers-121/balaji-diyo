import Script from "next/script";

/**
 * Leados (myleados.ai) SEO content embed for the blog listing page —
 * client-supplied snippet, loaded as-is. `lazyOnload` since this is
 * supplementary SEO content, not anything the page needs interactive
 * immediately (same reasoning as GoogleAnalytics.tsx choosing
 * `afterInteractive` over `beforeInteractive` for its own non-critical
 * script). The empty div is Leados' own mount point — it fills it
 * client-side once its script loads.
 */
export function LeadosBlogEmbed() {
  return (
    <>
      <div id="leados-blog" />
      <Script
        src="https://app.myleados.ai/api/tenant/website-45yl/seo/embed"
        strategy="lazyOnload"
      />
    </>
  );
}
