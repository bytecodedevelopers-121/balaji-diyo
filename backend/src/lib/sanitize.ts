// Allow only safe characters in a single path segment (no slashes).
export function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_.]/g, '');
}

// Sanitize a full storage path (e.g. "workers/photos/abc-123.jpg").
// Splits on '/', sanitizes each segment, rejoins — never allows traversal.
export function sanitizeStoragePath(storagePath: string): string {
  return storagePath
    .split('/')
    .map(sanitizePathSegment)
    .filter(Boolean)
    .join('/');
}
