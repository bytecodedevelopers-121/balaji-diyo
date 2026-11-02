import { siteConfig } from "@/config/site";
import { absoluteUrl } from "./canonical";

export type JsonLd = Record<string, unknown>;

/**
 * Serializes a JSON-LD object for a `<script type="application/ld+json">`
 * tag. Escapes `<` so a string value containing `</script>` can't break
 * out of the tag — never interpolate raw `JSON.stringify` output (or,
 * worse, a template string) directly into a script tag.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Organization schema for the root layout. Deliberately minimal —
 * `sameAs` (social profiles), `logo`, and `address` should be added once
 * confirmed, not guessed.
 */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
  };
}

/** WebSite schema for the root layout. */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
  };
}
