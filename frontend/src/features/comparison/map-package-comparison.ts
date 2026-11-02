import type { PackageDetail } from "@/app/[slug]/data";
import type { ComparisonTrip } from "./comparison.types";

const NOT_PROVIDED = "Not provided";

function findFact(
  trip: PackageDetail,
  labels: readonly string[],
): string | undefined {
  const normalizedLabels = new Set(labels.map((label) => label.toLowerCase()));
  return trip.quickFacts.find((fact) =>
    normalizedLabels.has(fact.label.trim().toLowerCase()),
  )?.value;
}

function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return NOT_PROVIDED;
  return `From $${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(price)} per traveler`;
}

function formatWalkingHours(trip: PackageDetail): string {
  const authored = findFact(trip, [
    "Daily Walking Hours",
    "Walking Hours",
    "Walking Hour",
  ]);
  if (authored) return authored;

  const hours = trip.detailedItinerary
    .flatMap((leg) => leg.days)
    .filter((day) => !day.transport || day.transport.toLowerCase() === "on foot")
    .map((day) => day.durationHours)
    .filter((value) => Number.isFinite(value) && value > 0);

  if (hours.length === 0) return NOT_PROVIDED;
  const min = Math.min(...hours);
  const max = Math.max(...hours);
  return min === max ? `${min} hrs` : `${min}–${max} hrs`;
}

export function mapPackageToComparisonTrip(
  trip: PackageDetail,
): ComparisonTrip {
  return {
    slug: trip.slug,
    title: trip.title,
    image: trip.heroImages[0] ?? null,
    imageAlt: `${trip.title} — lead photo`,
    details: {
      difficulty: findFact(trip, ["Difficulty", "Difficulty Level"]) ?? NOT_PROVIDED,
      duration: findFact(trip, ["Duration"]) ?? NOT_PROVIDED,
      altitude: findFact(trip, ["Max Altitude", "Maximum Altitude"]) ?? NOT_PROVIDED,
      season:
        findFact(trip, ["Best Season", "Best Seasons", "Season", "Seasons"]) ??
        NOT_PROVIDED,
      price: formatPrice(trip.priceFrom),
      walkingHours: formatWalkingHours(trip),
      accommodation:
        findFact(trip, ["Accommodation", "Accommodation Type"]) ?? NOT_PROVIDED,
      highlights:
        trip.highlights.length > 0
          ? trip.highlights.slice(0, 3).join("; ")
          : NOT_PROVIDED,
    },
  };
}
