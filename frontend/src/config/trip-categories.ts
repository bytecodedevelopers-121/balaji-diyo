/**
 * The six activity categories shown as cards in the homepage hero, reused as
 * filters in the destination menu. `key` matches `SampleTrip.categories`.
 */
export const TRIP_CATEGORIES = [
  { key: "trekking", label: "Trekking and Hiking", href: "/trekking-routes-in-nepal" },
  { key: "climbing", label: "Climbing and Expedition", href: "/nepal-peak-climbing" },
  { key: "safari", label: "Jungle and Wildlife Safari", href: "/nepal-tour-packages" },
  { key: "tours", label: "Nepal Tours and Holidays", href: "/nepal-tour-packages" },
  { key: "day", label: "Day Tours and Activities", href: "/nepal-tour-packages" },
  { key: "deals", label: "Deals and Discounts", href: "/last-minute-trip-deals" },
] as const;

export type TripCategoryKey = (typeof TRIP_CATEGORIES)[number]["key"];
