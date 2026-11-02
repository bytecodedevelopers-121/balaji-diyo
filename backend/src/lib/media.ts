import { Request } from 'express';

// Public URL for a file stored under PUBLIC_ROOT, served by express.static
// at /files/public/* (see app.ts). `storagePath` is the relative path saved
// on a Media record (e.g. "media/<uuid>.webp").
export const toPublicFileUrl = (storagePath: string): string => `/files/public/${storagePath}`;

// Absolute version of the above, for API responses consumed by the
// separate Next.js public frontend (a relative "/files/public/..." URL
// would otherwise resolve against the *frontend's* own origin, not this
// API's). Built from the live request rather than a hardcoded/env host,
// same pattern already used for the PACO payment callback URL
// (payment.controller.ts's `${req.protocol}://${req.get('host')}`) — works
// unmodified across dev/staging/prod with no extra config.
export const toAbsolutePublicFileUrl = (req: Request, storagePath: string): string =>
  `${req.protocol}://${req.get('host')}${toPublicFileUrl(storagePath)}`;

/**
 * Turns one raw-storage-path field on an API response item into an
 * absolute URL (or leaves it `null`) right before the response goes out
 * — the shared shape package-map.controller.ts's `mapImageUrl` and
 * blog.controller.ts's `imageUrl` both need, since their services attach
 * the raw `Media.fullPath` (see each repository's own
 * findFeaturedImagePaths) and stop there deliberately: only the
 * controller has `req` to build the absolute URL from.
 */
export function withAbsoluteImageField<T extends Record<K, string | null>, K extends string>(
  req: Request,
  item: T,
  key: K,
): T {
  const value = item[key];
  return { ...item, [key]: value ? toAbsolutePublicFileUrl(req, value) : null } as T;
}
