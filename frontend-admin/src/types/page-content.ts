/** One saved section of a public page, as returned by `GET /page-sections/:pageKey`. */
export interface PageSection {
  id: string;
  pageKey: string;
  sectionKey: string;
  content: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface SaveSectionDto {
  content: Record<string, unknown>;
  isActive?: boolean;
}

export type FieldKind = "text" | "textarea" | "html" | "url" | "number" | "image" | "list" | "select" | "richtext" | "video";

/** One editable field of a section. `list` fields repeat `itemFields` once per row. */
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  /** For `list`: the fields of each row, and what to call a row ("question", "partner"). */
  itemFields?: FieldDef[];
  itemLabel?: string;
  /** What the website shows until an admin saves a value — pre-filled in the editor so it can be seen and changed. */
  defaultValue?: unknown;
  /** For `select`: the allowed values. */
  options?: string[];
}

export interface SectionDef {
  key: string;
  title: string;
  description: string;
  fields: FieldDef[];
}

export interface PageDef {
  key: string;
  title: string;
  description: string;
  /** Public URL of the page, for the "View page" link. */
  path: string;
  sections: SectionDef[];
}
