const STORAGE_KEY = "auth-access-token";

// Treat a cached token as unusable this many seconds before its real expiry,
// so we never hand out a token that's about to die mid-request.
const EXPIRY_SKEW_SECONDS = 30;

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const { exp } = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/**
 * Access token cache, backed by sessionStorage — cleared automatically when
 * the tab closes, unlike localStorage. Kept out of the zustand `persist`
 * config on purpose so it never ends up in localStorage next to the
 * long-lived `user` cache.
 *
 * This only saves the network round trip to /auth/refresh on a page reload
 * when we already hold a token that hasn't expired yet. The token is exactly
 * as sensitive as it was sitting in memory, and the httpOnly refresh-token
 * cookie remains the only thing that can mint a new one — this cache can
 * never extend a session past what that cookie already allows.
 */
export function readCachedAccessToken(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) return null;

  const exp = decodeExpiry(token);
  if (exp === null || exp * 1000 <= Date.now() + EXPIRY_SKEW_SECONDS * 1000) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }

  return token;
}

export function writeCachedAccessToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
