export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

// Legacy opaque strings (JOSE compact tokens, occasionally malformed JSON) that
// need to land in a Prisma Json? column without losing data. Tries a real
// parse first so genuinely-JSON legacy text round-trips as structured data.
export function toJsonOrWrap(raw: string | null | undefined): unknown {
  if (raw === null || raw === undefined || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
