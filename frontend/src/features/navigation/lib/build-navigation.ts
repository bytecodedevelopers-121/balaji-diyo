import "server-only";
import {
  headerNavigation as staticHeaderNavigation,
  destinationDropdown as staticDestinationDropdown,
  aboutDropdown as staticAboutDropdown,
  menuNavigation as staticMenuNavigation,
  footerColumns as staticFooterColumns,
  type NavItem,
  type DestinationDropdownData,
  type AboutDropdownData,
  type FooterColumn,
} from "@/config/navigation";
import { getMenuTree } from "../api/get-navigation";
import type { RawMenuNode } from "../types/menu-item.types";

/**
 * Mirrors flamingo-base's `MenuItem::getItemSlugAttribute()` verbatim:
 * an external item uses its own `external_link`; an internal one resolves
 * through the flat `/<slug>` namespace every other migrated content type
 * uses (see `app/[slug]/resolve-content.ts`).
 */
function menuNodeHref(node: RawMenuNode): string {
  return node.isExternal ? (node.externalLink ?? "#") : `/${node.urlSegment ?? ""}`;
}

function toNavItem(node: RawMenuNode): NavItem {
  return { label: node.label, href: menuNodeHref(node) };
}

function findRoot(nodes: RawMenuNode[], label: string): RawMenuNode | undefined {
  return nodes.find((node) => node.label === label);
}

/**
 * `MenuItem` has no "default open tab" field, so which category/
 * sub-category starts active is a documented convention, not curated
 * data: the first child that itself has children, falling back to the
 * first child outright if none do (so something is always active).
 */
function activeIndex(nodes: RawMenuNode[]): number {
  const withChildren = nodes.findIndex((node) => node.children.length > 0);
  return withChildren === -1 ? 0 : withChildren;
}

/**
 * `DestinationDropdown.tsx`'s 4-tier taxonomy (category → sub-category →
 * sub-sub-category → package) is Figma-locked, curated content — not
 * derived from arbitrary tree shape/depth across the whole `main_menu`
 * type. Instead this reads *one* root item literally labeled
 * "Destination" and maps only its own subtree by depth, which is safe
 * because that subtree exists to be exactly this panel's content, not
 * shared/reused data. Returns `null` (triggering the static fallback) if
 * that root isn't curated yet, or has no children.
 */
function buildDestinationDropdown(mainMenu: RawMenuNode[]): DestinationDropdownData | null {
  const root = findRoot(mainMenu, "Destination");
  if (!root || root.children.length === 0) return null;

  const categories = root.children.map((category, i) => ({
    label: category.label,
    active: i === activeIndex(root.children),
    // A category/sub-category node is itself a real `MenuItem` with its
    // own `urlSegment` (curated by the admin as that tier's own landing
    // page, e.g. "Peak Climbing" → `nepal-peak-climbing`) — not just a
    // hover trigger with no real destination of its own. Reading it here
    // is what "View All" actually links to; FIXED 2026-09-01
    // (user-reported bug) — this used to discard it and hardcode every
    // category/sub-category to the same static fallback href regardless
    // of which one was active.
    viewAllHref: menuNodeHref(category),
    subCategories: category.children.map((subCategory, j) => ({
      label: subCategory.label,
      active: j === activeIndex(category.children),
      viewAllHref: menuNodeHref(subCategory),
      subSubCategories: subCategory.children.map((subSubCategory) => ({
        title: subSubCategory.label,
        href: menuNodeHref(subSubCategory),
        packages: subSubCategory.children.map(toNavItem),
      })),
    })),
  }));

  return { categories };
}

/**
 * `AboutDropdown.tsx`'s 2-column layout — same "one dedicated root, mapped
 * by depth within its own subtree only" approach as `buildDestinationDropdown`
 * above, for the same reason.
 */
function buildAboutDropdown(mainMenu: RawMenuNode[]): AboutDropdownData | null {
  const root = findRoot(mainMenu, "About");
  if (!root || root.children.length === 0) return null;

  return {
    columns: root.children.map((column) => ({
      heading: column.label,
      links: column.children.map(toNavItem),
    })),
  };
}

/**
 * Footer's 3-column layout reads generically, unlike the two dropdowns
 * above: every `footer_menu` root with children becomes one column
 * (root's label = column title, its direct children = links) — a plain
 * 2-level read that already matches the footer UI's own 2-level
 * structure, so no dedicated-root lookup is needed here.
 */
function buildFooterColumns(footerMenu: RawMenuNode[]): FooterColumn[] | null {
  const columns = footerMenu
    .filter((root) => root.children.length > 0)
    .map((root) => ({ title: root.label, links: root.children.map(toNavItem) }));

  return columns.length > 0 ? columns : null;
}

export interface HeaderNavData {
  headerNavigation: NavItem[];
  destinationDropdown: DestinationDropdownData;
  aboutDropdown: AboutDropdownData;
  menuNavigation: NavItem[];
}

/**
 * Resolves everything `Header.tsx` (and the components it renders —
 * `DestinationDropdown`, `AboutDropdown`, `MobileMenu`, `MobileNavPanel`)
 * needs, from the real `main_menu` tree, falling back per-slot to
 * `config/navigation.ts`'s static defaults wherever the curated content
 * for that slot isn't there yet.
 *
 * `menuNavigation` (the mobile full-screen overlay's own link list) has
 * no equivalent real `MenuType` to source from — flamingo-base's schema
 * only ever had `main_menu`/`footer_menu` (confirmed against the live
 * migrated data), and this list was always a distinct, Figma-sampled set
 * rather than a subset of either. Left static until/unless a third menu
 * type is ever curated for it.
 */
export async function getHeaderNavData(): Promise<HeaderNavData> {
  const mainMenu = await getMenuTree("main_menu");

  return {
    headerNavigation: mainMenu.length > 0 ? mainMenu.map(toNavItem) : staticHeaderNavigation,
    destinationDropdown: buildDestinationDropdown(mainMenu) ?? staticDestinationDropdown,
    aboutDropdown: buildAboutDropdown(mainMenu) ?? staticAboutDropdown,
    menuNavigation: staticMenuNavigation,
  };
}

export interface FooterNavData {
  footerColumns: FooterColumn[];
}

export async function getFooterNavData(): Promise<FooterNavData> {
  const footerMenu = await getMenuTree("footer_menu");

  return {
    footerColumns: buildFooterColumns(footerMenu) ?? staticFooterColumns,
  };
}
