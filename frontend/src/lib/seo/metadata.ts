import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { absoluteUrl, canonicalUrl, isProduction } from "./canonical";

export interface PageMetadataInput {
  title: string;
  description?: string;
  /** Route path, e.g. "/" or "/trips". Used to build canonical and Open Graph URLs. */
  path: string;
  /** Path to a local image (e.g. "/images/placeholders/og-default.svg"). No external URLs — see project constraints. */
  image?: string;
  /**
   * Force this specific page to noindex even in production (e.g. a
   * thank-you/confirmation page). Never used to force indexing outside
   * production — see isProduction() in ./canonical.
   */
  noIndex?: boolean;
}

/**
 * Builds a Next.js `Metadata` object with sane defaults: canonical URL
 * (production only), Open Graph, Twitter, and environment-aware robots
 * directives. Intended for route `generateMetadata`/`metadata` exports.
 *
 * Compatible with future API content: pass through whatever `title`/
 * `description`/`image` a Server Component fetched from the API — this
 * function has no fetching of its own.
 */
export function buildMetadata(input: PageMetadataInput): Metadata {
  const description = input.description ?? siteConfig.description;
  const image = absoluteUrl(input.image ?? siteConfig.defaultOgImage);
  const url = absoluteUrl(input.path);
  const canonical = canonicalUrl(input.path);
  const shouldIndex = isProduction() && !input.noIndex;

  return {
    title: input.title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: {
      index: shouldIndex,
      follow: shouldIndex,
    },
    openGraph: {
      title: input.title,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: image }],
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
  };
}
