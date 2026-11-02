import { stripHtml } from "@/lib/richText";
import type { CostDetail, CostDetailInput } from "@/types/package";
import type { CostCategoryType } from "@/types/cost-category";

/**
 * One "category block" on the package's What's Included / Excluded list: a
 * shared admin-managed category (see Include / Exclude Categories page) plus
 * the rich-text content this package lists under it.
 */
export interface CostGroupInput {
  costCategoryId: string;
  /** Only used for legacy rows with no shared category — kept so they round-trip. */
  detailKey: string;
  html: string;
}

export interface CostFormShape {
  costIncludes: CostGroupInput[];
  costExcludes: CostGroupInput[];
}

/** Package.costDetails (flat rows) → one group per category. A title-only row (older item-style data) becomes a list item. */
export function groupCostDetails(rows: CostDetail[] | undefined, type: CostCategoryType): CostGroupInput[] {
  const groups = new Map<string, CostGroupInput>();
  for (const row of (rows ?? []).filter((r) => r.detailType === type)) {
    const key = row.costCategoryId ?? `legacy:${row.detailKey}`;
    const group = groups.get(key) ?? { costCategoryId: row.costCategoryId ?? "", detailKey: row.detailKey, html: "" };
    group.html += row.detailDescription?.trim() ? row.detailDescription : `<ul><li>${row.detailTitle}</li></ul>`;
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Form groups → the flat `costIncludes`/`costExcludes` rows the API accepts. Blocks with no visible text are dropped. */
export function toCostDetailPayload(groups: CostGroupInput[]): CostDetailInput[] {
  return groups
    .filter((group) => stripHtml(group.html).length > 0)
    .map((group) => ({
      ...(group.costCategoryId ? { costCategoryId: group.costCategoryId } : { detailKey: group.detailKey }),
      detailDescription: group.html,
    }));
}
