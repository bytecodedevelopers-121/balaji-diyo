/**
 * Tab identity for the package form. Kept out of PackageForm.tsx so that file
 * only exports components (fast-refresh requirement) — pages import these to
 * render the tab bar the form's panels respond to.
 */

/** The tabs PackageForm itself owns. Itinerary and Departures are separate
 *  forms and are appended to the bar by PackageDetailPage. */
export const PACKAGE_FORM_TABS = [
  { value: "overview", label: "Overview" },
  { value: "inclusion", label: "What's Included" },
  { value: "photos", label: "Photos" },
  { value: "reviews", label: "Reviews" },
  { value: "facts", label: "Facts & Info" },
  { value: "gear", label: "Gear" },
  { value: "group-price", label: "Group Price" },
];

export const ITINERARY_TAB = "itinerary";
export const AVAILABILITY_TAB = "availability";
export const TRIP_MAP_TAB = "trip-map";

const formTab = (value: string) => PACKAGE_FORM_TABS.find((t) => t.value === value)!;

/**
 * Every tab of the package editor, ordered like the sections of the public trip
 * page. Itinerary, Trip Map and Departures are their own forms that need a saved
 * package, so the create page lists them too but shows a hint until it is saved.
 */
export const PACKAGE_ALL_TABS = [
  formTab("overview"),
  { value: ITINERARY_TAB, label: "Itinerary" },
  { value: TRIP_MAP_TAB, label: "Trip Map" },
  formTab("inclusion"),
  { value: AVAILABILITY_TAB, label: "Departures & Add-ons" },
  formTab("group-price"),
  formTab("photos"),
  formTab("reviews"),
  formTab("facts"),
  formTab("gear"),
];

/** Lets a button outside the <form> submit it via the HTML form-owner attribute. */
export const PACKAGE_FORM_ID = "package-form";
