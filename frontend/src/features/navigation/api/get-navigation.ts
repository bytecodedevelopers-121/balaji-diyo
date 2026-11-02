import "server-only";
import { apiFetch } from "@/lib/api/api-client";
import type { RawMenuNode } from "../types/menu-item.types";

export type MenuTypeKey = "main_menu" | "footer_menu";

/**
 * Fetches one menu type's full tree from `GET /menu-items/tree/by-key/:key`
 * — the live, admin-editable mechanism this replaces `config/navigation.ts`'s
 * hardcoded arrays with, matching how flamingo-base's old site rendered nav
 * (`ContentController::getMenu`/`getMenuByType` eager-loading the whole
 * `MenuType` tree; see that controller for the mechanism this reproduces).
 *
 * Tagged `"navigation"` for on-demand revalidation — see
 * app/api/revalidate/route.ts and the backend's `MenuItemService`, which
 * POSTs this tag after any menu-item create/update/delete/restore (same
 * pattern as `features/team/api/get-team-members.ts`'s `"team-members"`
 * tag). The 900s revalidate is a time-based fallback only.
 *
 * Never throws — returns `[]` on any failure (API unreachable, or the
 * type key not curated yet), so every caller in
 * `features/navigation/lib/build-navigation.ts` can fall back to
 * `config/navigation.ts`'s static defaults instead of the whole page
 * failing to render.
 */
export async function getMenuTree(key: MenuTypeKey): Promise<RawMenuNode[]> {
  try {
    return await apiFetch<RawMenuNode[]>(`/menu-items/tree/by-key/${key}`, {
      next: { revalidate: 900, tags: ["navigation"] },
    });
  } catch {
    return [];
  }
}
