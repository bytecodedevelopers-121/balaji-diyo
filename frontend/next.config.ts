import type { NextConfig } from "next";
import { legacyRedirects } from "./src/config/legacy-routes";
import { toNextRedirects } from "./src/lib/seo/redirects";

// This app's own Express API serves uploaded media absolutely (see
// backend/src/lib/media.ts's toAbsolutePublicFileUrl, e.g.
// `${API_URL}/files/public/...`) — package hero/gallery photos now come
// through as one of these URLs (see features/trips/lib/map-package-detail.ts),
// rendered via next/image (TripHeader's ImageGallery), which refuses any
// remote host not explicitly allowed here. Derived from the same
// NEXT_PUBLIC_API_URL every fetch already targets, not a guessed/hardcoded
// domain — unrelated to the *legacy* site's asset host below, which is
// still unconfirmed.
function apiFileRemotePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  try {
    const { protocol, hostname, port } = new URL(apiUrl);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/files/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // legacyRedirects is otherwise empty pending the old site's URL audit —
  // see src/config/legacy-routes.ts for both that and its one populated
  // entry (the /trekking-routes-map-of-nepal → /map rename).
  async redirects() {
    return toNextRedirects(legacyRedirects);
  },

  images: {
    remotePatterns: apiFileRemotePattern(),
    // Dev/local only: Next's optimizer refuses to fetch from hosts that
    // resolve to private/local IPs (SSRF guard), and `localhost` (the API
    // in dev) always does. Never enabled in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Optimization runs on the Lightsail VM itself (sharp inside `next
    // start`), so there is no Vercel quota to dodge — the old
    // `unoptimized: true` is gone. WebP only for now: AVIF is ~20% smaller
    // but much slower to encode on a 2-vCPU box; add "image/avif" later if
    // CPU load allows.
    formats: ["image/webp"],
    // Optimized variants are cached under .next/cache/images and Nginx
    // caches /_next/image on top (deploy/nginx/boundless.conf).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Trimmed from Next's defaults to keep the number of cached variants
    // (and first-hit encodes) small.
    deviceSizes: [480, 768, 1080, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75, 85, 95],
  },

  // Legacy image/document URL handling (remote patterns for the *old*
  // site's own asset host, if any) is intentionally not configured yet —
  // no legacy asset domain has been confirmed. Add it here once the audit
  // in src/config/legacy-routes.ts identifies one; do not guess a domain.
};

export default nextConfig;
