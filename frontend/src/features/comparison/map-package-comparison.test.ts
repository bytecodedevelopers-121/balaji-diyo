import { describe, expect, it } from "vitest";
import type { PackageDetail } from "@/app/[slug]/data";
import { mapPackageToComparisonTrip } from "./map-package-comparison";

function packageDetail(overrides: Partial<PackageDetail> = {}): PackageDetail {
  return {
    slug: "everest-base-camp-trek",
    title: "Everest Base Camp Trek",
    heroImages: ["https://example.com/everest.jpg"],
    quickFacts: [
      { label: "Duration", value: "14 days" },
      { label: "Difficulty", value: "Challenging" },
      { label: "Max Altitude", value: "5,364 m" },
      { label: "Best Seasons", value: "Spring and autumn" },
      { label: "Accommodation", value: "Tea houses" },
    ],
    priceFrom: 1299,
    highlights: ["Everest views", "Sherpa culture"],
    detailedItinerary: [
      {
        title: "Everest Base Camp Trek",
        image: "",
        days: [
          { day: 1, title: "Trek", altitudeM: 2800, durationHours: 5, locations: [] },
          { day: 2, title: "Trek", altitudeM: 3400, durationHours: 7, locations: [] },
        ],
      },
    ],
    ...overrides,
  } as PackageDetail;
}

describe("mapPackageToComparisonTrip", () => {
  it("maps real package fields into comparison rows", () => {
    const result = mapPackageToComparisonTrip(packageDetail());

    expect(result.details).toEqual({
      difficulty: "Challenging",
      duration: "14 days",
      altitude: "5,364 m",
      season: "Spring and autumn",
      price: "From $1,299 per traveler",
      walkingHours: "5–7 hrs",
      accommodation: "Tea houses",
      highlights: "Everest views; Sherpa culture",
    });
  });

  it("uses explicit missing values instead of fabricated data", () => {
    const result = mapPackageToComparisonTrip(
      packageDetail({
        heroImages: [],
        quickFacts: [],
        priceFrom: 0,
        highlights: [],
        detailedItinerary: [],
      }),
    );

    expect(result.image).toBeNull();
    expect(Object.values(result.details)).toEqual(Array(8).fill("Not provided"));
  });
});
