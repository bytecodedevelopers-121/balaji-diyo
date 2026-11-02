// Allow only safe characters in a single path segment (no slashes).
export function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9\-_.]/g, '');
}
