import { apiFetch } from "@/lib/api/api-client";

/** One section as stored by the admin's page-content CMS. */
interface RawSection {
  content: Record<string, unknown>;
  isActive: boolean;
}

export type PageSections = Record<string, RawSection>;

/** Pages are edited in the admin, so they refresh quickly. */
const REVALIDATE_SECONDS = 30;

/**
 * Fetches every CMS section of one page (`GET /page-sections/public/:pageKey`).
 * Degrades to `{}` when the API is unreachable, so each section falls back to
 * its built-in copy and a page is never blank because the CMS is down.
 */
export async function getPageSections(pageKey: string): Promise<PageSections> {
  try {
    return await apiFetch<PageSections>(`/page-sections/public/${encodeURIComponent(pageKey)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["page-sections", `page-sections:${pageKey}`] },
    });
  } catch {
    return {};
  }
}

export interface ResolvedSection<T> {
  content: T;
  /** False when an admin switched the section off. */
  isActive: boolean;
}

/**
 * Merges a section's saved fields over its built-in defaults. A field missing
 * from the CMS (or saved empty) keeps its default, so a half-filled section
 * still renders completely; arrays are replaced as a whole, never merged.
 */
export function resolveSection<T extends object>(
  sections: PageSections,
  key: string,
  defaults: T,
  /** Optional fields where an empty saved value means "show nothing" instead of "use the default". */
  clearableFields: readonly string[] = [],
): ResolvedSection<T> {
  const saved = sections[key];
  if (!saved) return { content: defaults, isActive: true };
  const merged: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [field, value] of Object.entries(saved.content ?? {})) {
    if (value === "" && clearableFields.includes(field)) {
      merged[field] = "";
      continue;
    }
    if (value === undefined || value === null || value === "") continue;
    merged[field] = value;
  }
  return { content: merged as T, isActive: saved.isActive };
}
