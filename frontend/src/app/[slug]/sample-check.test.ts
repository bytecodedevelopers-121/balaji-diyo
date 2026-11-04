import { describe, expect, it } from "vitest";
import { ALL_SAMPLE_TRIPS } from "@/lib/sample-trips";
import { getSamplePackageDetail } from "./sample-packages";

describe("sample package pages", () => {
  it("builds a complete page for every sample trip", () => {
    for (const trip of ALL_SAMPLE_TRIPS) {
      const detail = getSamplePackageDetail(trip.slug);
      expect(detail, trip.slug).not.toBeNull();
      expect(detail!.detailedItinerary[0].days.length).toBeGreaterThan(0);
      expect(detail!.routePath.length).toBeGreaterThan(1);
      expect(detail!.departures.length).toBeGreaterThan(0);
    }
  });

  it("gives Mount Kailash a full 14-day itinerary on its own route", () => {
    const detail = getSamplePackageDetail("mount-kailash-tour")!;
    expect(detail.detailedItinerary[0].days).toHaveLength(14);
    expect(detail.routePath.length).toBe(8);
    expect(detail.overview).toContain("Lake Manasarovar");
  });
});
