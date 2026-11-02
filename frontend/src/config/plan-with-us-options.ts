/**
 * Static option lists for the /plan-with-us wizard (design-references/
 * "Plan with us - Preferences.png"). None of this is sourced from a
 * backend list endpoint — the design shows a fixed, small set of
 * choices (4 destination cards, 6 experience types, 3 accommodation
 * tiers), not something that needs live data.
 *
 * Destination thumbnails are real exports, not screenshot crops: Tibet
 * and Bhutan reuse each region's own real FEATURED package photo
 * (Package "Tibet Culture Tours" / "Bhutan Culture Tour" — both are
 * real, currently-sold packages, confirmed against the dev DB, not
 * placeholders); Nepal and "Explore All" reuse existing clean exports
 * already in this repo (contact/hero.jpg, about-us/hero.jpg) rather
 * than the design's own screenshot (which has UI chrome baked in) or a
 * real photo with a promotional banner/faces baked in (an earlier pick
 * for Nepal, replaced for that reason).
 */
export interface PlanWithUsDestination {
  id: string;
  label: string;
  image: string;
}

export const destinations: PlanWithUsDestination[] = [
  { id: "nepal", label: "Nepal", image: "/images/plan-with-us/nepal.jpg" },
  { id: "tibet", label: "Tibet", image: "/images/plan-with-us/tibet.jpg" },
  { id: "bhutan", label: "Bhutan", image: "/images/plan-with-us/bhutan.jpg" },
  { id: "explore-all", label: "Explore All", image: "/images/plan-with-us/explore-all.jpg" },
];

export interface PlanWithUsExperience {
  id: string;
  label: string;
}

export const experiences: PlanWithUsExperience[] = [
  { id: "trekking", label: "Trekking" },
  { id: "tour", label: "Tour" },
  { id: "peak-climbing", label: "Peak Climbing" },
  { id: "expedition", label: "Expedition" },
  { id: "heli-tour", label: "Heli Tour" },
  { id: "safari", label: "Safari" },
];

export interface PlanWithUsAccommodation {
  id: string;
  label: string;
  description: string;
}

export const accommodationStyles: PlanWithUsAccommodation[] = [
  { id: "basic", label: "Basic", description: "Clean & simple guesthouses" },
  { id: "comfortable", label: "Comfortable", description: "3-4 star hotels/lodges" },
  { id: "luxury", label: "Luxury", description: "5 star & premium resorts" },
];

/**
 * The design shows "Select Range" as a dropdown placeholder and
 * "USD 500 - 1000" as a chosen value on the Review step — a real-world
 * band set matching that shape, not a literal transcription (the
 * dropdown's own open state isn't shown anywhere in either mockup).
 */
export const budgetRanges: string[] = [
  "Under USD 500",
  "USD 500 - 1000",
  "USD 1000 - 2000",
  "USD 2000 - 5000",
  "USD 5000+",
];
