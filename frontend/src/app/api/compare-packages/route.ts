import { NextResponse } from "next/server";
import { getPackageBySlug } from "@/features/trips/api/get-package-by-slug";
import { mapPackageToComparisonTrip } from "@/features/comparison/map-package-comparison";
import type { ComparisonPackagesResponse } from "@/features/comparison/comparison.types";

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request: Request): Promise<NextResponse> {
  const rawSlugs = new URL(request.url).searchParams.get("slugs") ?? "";
  const slugs = [...new Set(rawSlugs.split(",").map((slug) => slug.trim()).filter(Boolean))];

  if (slugs.length === 0) {
    return NextResponse.json({ items: [], missing: [] } satisfies ComparisonPackagesResponse);
  }
  if (slugs.some((slug) => slug.length > 200 || !VALID_SLUG.test(slug))) {
    return NextResponse.json({ error: "One or more package slugs are invalid." }, { status: 400 });
  }

  const packages = await Promise.all(slugs.map((slug) => getPackageBySlug(slug)));
  const response: ComparisonPackagesResponse = {
    items: packages.filter((trip) => trip !== null).map(mapPackageToComparisonTrip),
    missing: slugs.filter((_, index) => packages[index] === null),
  };
  return NextResponse.json(response);
}
