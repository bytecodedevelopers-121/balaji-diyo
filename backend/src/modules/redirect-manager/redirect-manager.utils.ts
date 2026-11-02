const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Redirect matching is pathname-only. Keeping one canonical representation
 * prevents trailing-slash variants from becoming separate cache/database
 * lookups while still allowing the resolver to read legacy rows that contain
 * a trailing slash.
 */
export function normalizeRedirectSource(source: string): string {
  const trimmed = source.trim();
  if (trimmed === '/') return '/';
  return trimmed.replace(/\/{2,}/g, '/').replace(/\/$/, '');
}

export function isValidRedirectSource(source: string): boolean {
  const trimmed = source.trim();
  return (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('?') &&
    !trimmed.includes('#')
  );
}

/** Internal paths and explicit HTTP(S) URLs are supported by the public site. */
export function isValidRedirectDestination(destination: string): boolean {
  const trimmed = destination.trim();

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;

  try {
    const url = new URL(trimmed);
    return HTTP_PROTOCOLS.has(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function redirectSourceCandidates(source: string): string[] {
  const normalized = normalizeRedirectSource(source);
  if (normalized === '/') return ['/'];

  return source === normalized
    ? [normalized, `${normalized}/`]
    : [source, normalized];
}
