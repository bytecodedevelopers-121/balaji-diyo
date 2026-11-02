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
  { value: "facts", label: "Facts & Info" },
  { value: "gear", label: "Gear" },
  { value: "group-price", label: "Group Price" },
];

/** Lets a button outside the <form> submit it via the HTML form-owner attribute. */
export const PACKAGE_FORM_ID = "package-form";
