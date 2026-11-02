export const COMPARISON_FIELDS = [
  "difficulty",
  "duration",
  "altitude",
  "season",
  "price",
  "walkingHours",
  "accommodation",
  "highlights",
] as const;

export type ComparisonField = (typeof COMPARISON_FIELDS)[number];

export interface ComparisonTrip {
  slug: string;
  title: string;
  image: string | null;
  imageAlt: string;
  details: Record<ComparisonField, string>;
}

export interface ComparisonPackagesResponse {
  items: ComparisonTrip[];
  missing: string[];
}
