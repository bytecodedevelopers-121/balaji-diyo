/**
 * Mirrors `backend/src/modules/menu-item/menu-item.repository.ts`'s
 * `MenuItemTreeNode` (itself a Prisma `MenuItem` + recursive `children`).
 * This is what `GET /menu-items/tree/by-key/:key` returns.
 */
export interface RawMenuNode {
  id: string;
  label: string;
  itemOrder: number;
  isExternal: boolean;
  externalLink: string | null;
  urlSegment: string | null;
  isActive: boolean;
  children: RawMenuNode[];
}
