import type { Category } from "@/types/category";

/**
 * Tour types and regions are stored as "destination" categories:
 *  - a tour type is a top-level category — one of the built-in ones below, or one an admin
 *    created (marked with `extraField1 = "tour-type"`);
 *  - a region is a category whose parent is a tour type.
 */
export const TOUR_TYPE_MARKER = "tour-type";

/** The tour types that exist on the public site, by category slug. */
export const BUILT_IN_TOUR_TYPES = [
  { slug: "trekking-routes-in-nepal", label: "Trekking and Hiking" },
  { slug: "nepal-peak-climbing", label: "Climbing and Expedition" },
  { slug: "nepal-tour-packages", label: "Tours, Holidays and Safari" },
  { slug: "nepal-day-tours", label: "Day Tours and Activities" },
  { slug: "last-minute-trip-deals", label: "Last Minute Deals" },
] as const;

export const isBuiltInTourType = (c: Category) => BUILT_IN_TOUR_TYPES.some((t) => t.slug === c.slug);

export const isTourType = (c: Category) => c.extraField1 === TOUR_TYPE_MARKER || isBuiltInTourType(c);

/** Display name of a tour type: the public label for built-ins, otherwise the category title. */
export const tourTypeLabel = (c: Category) => BUILT_IN_TOUR_TYPES.find((t) => t.slug === c.slug)?.label ?? c.title;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
