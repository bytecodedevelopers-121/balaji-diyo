import { absoluteUrl, isProduction } from "@/lib/seo/canonical";
import { siteConfig } from "@/config/site";

/**
 * llms.txt — an emerging (non-W3C/IETF, not Google-endorsed) convention for
 * giving LLM-based assistants (ChatGPT, Claude, Perplexity, etc.) a compact,
 * hand-curated summary of the site instead of making them crawl and infer
 * it. Not the same thing as sitemap.xml (that's for search-engine crawlers
 * enumerating every URL) or robots.txt (crawl permissions) — this is a
 * plain-text/Markdown "about this site" briefing.
 *
 * A route handler rather than a static public/llms.txt file so it can use
 * absoluteUrl() — this repo never hardcodes a production domain in source
 * (see site.ts's own comment on `url`). Gated behind isProduction() the same
 * way robots.ts/sitemap.ts are, so a staging/preview deploy never hands an
 * assistant a set of non-production URLs.
 *
 * Static route list for now, matching sitemap.ts's own starting point —
 * expand alongside it as more sections (individual trip pages, CMS pages)
 * get added there. Keep this in sync by hand; nothing generates it.
 */
export async function GET() {
  if (!isProduction()) {
    return new Response("", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.name} is a Nepal-based operator planning guided treks, tours, and expeditions.`,
    "",
    "## Company",
    `- [About Us](${absoluteUrl("/about-us")})`,
    `- [Why Boundless Adventure](${absoluteUrl("/why-boundless-adventure")})`,
    `- [Our Team](${absoluteUrl("/team")})`,
    `- [Reviews](${absoluteUrl("/reviews")})`,
    `- [Contact](${absoluteUrl("/contact")})`,
    "",
    "## Trips",
    `- [Trekking Routes in Nepal](${absoluteUrl("/trekking-routes-in-nepal")})`,
    `- [Nepal Tour Packages](${absoluteUrl("/nepal-tour-packages")})`,
    `- [Nepal Peak Climbing](${absoluteUrl("/nepal-peak-climbing")})`,
    `- [Nepal Helicopter Tours](${absoluteUrl("/nepal-helicopter-tours")})`,
    `- [Route Maps](${absoluteUrl("/map")})`,
    `- [Compare Itineraries](${absoluteUrl("/compare-itineraries")})`,
    `- [Customize a Trip](${absoluteUrl("/customize-trip")})`,
    `- [Last-Minute Trip Deals](${absoluteUrl("/last-minute-trip-deals")})`,
    "",
    "## Planning & Policies",
    `- [Booking Terms and Conditions](${absoluteUrl("/booking-terms-and-conditions")})`,
    `- [Responsible Tourism](${absoluteUrl("/responsible-tourism")})`,
    `- [Volunteering in Nepal](${absoluteUrl("/volunteering-in-nepal")})`,
    `- [Company Documents](${absoluteUrl("/company-documents")})`,
    "",
    "## Other",
    `- [Blog](${absoluteUrl("/blog")})`,
    `- [Attractions](${absoluteUrl("/attractions")})`,
    "",
    `Contact: ${siteConfig.phone}`,
    "",
    `Full sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
