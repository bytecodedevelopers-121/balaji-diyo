import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService } from "@/services/category.service";
import { useCategoryTypes } from "@/hooks/queries/useCategoryTypes";
import { cn } from "@/utils";
import { BUILT_IN_TOUR_TYPES, isBuiltInTourType, isTourType, tourTypeLabel } from "@/lib/tourTypes";
import type { Category } from "@/types/category";

/**
 * Guided "where does this trip go" picker for the package form, mirroring how
 * visitors browse the public site: pick the tour type, the country and (for
 * Nepal) the trekking region. It writes into the form's own fields:
 *  - `categoryIds` gets the tour type, country and region categories, so the
 *    package shows up on those browse pages and in the header menu;
 *  - `destinationId` becomes the region when one is chosen, else the country.
 */

/** Country categories, by slug. Nepal shares the tours browse page. */
const COUNTRIES = [
  { slug: "nepal-tour-packages", label: "Nepal" },
  { slug: "bhutan-tours", label: "Bhutan" },
  { slug: "tibet-tours", label: "Tibet" },
  { slug: "multi-country-tour-packages", label: "Multi Country" },
] as const;

interface TripPlacementProps {
  categoryIds: string[];
  destinationId: string;
  onChange: (next: { categoryIds: string[]; destinationId: string }) => void;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-logo-navy-dark bg-logo-navy-dark text-white"
          : "border-outline-variant bg-white text-on-surface-variant hover:border-logo-navy hover:text-logo-navy",
      )}
    >
      {children}
    </button>
  );
}

export function TripPlacement({ categoryIds, destinationId, onChange }: TripPlacementProps) {
  const { data: typesData } = useCategoryTypes({ perPage: 100 });
  const typeId = (typesData?.data.items ?? []).find((t) => t.key === "destination")?.id;

  const params = { typeId, perPage: 200 };
  const { data } = useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryService.getAll(params),
    enabled: !!typeId,
  });
  const categories: Category[] = useMemo(() => data?.data.items ?? [], [data]);

  const bySlug = useMemo(() => new Map(categories.filter((c) => c.slug).map((c) => [c.slug as string, c])), [categories]);
  // Tour types: the built-in ones first (in public order), then any an admin created.
  const tourTypes = useMemo(() => {
    const builtIn = BUILT_IN_TOUR_TYPES.map((t) => bySlug.get(t.slug)).filter((c): c is Category => !!c);
    const custom = categories.filter((c) => isTourType(c) && !isBuiltInTourType(c) && c.isActive);
    return [...builtIn, ...custom].map((c) => ({ slug: c.slug as string, label: tourTypeLabel(c), category: c }));
  }, [categories, bySlug]);
  // Regions belong to a tour type: they are its child categories.
  const allRegions = useMemo(() => {
    const ids = new Set(tourTypes.map((t) => t.category.id));
    return categories.filter((c) => c.parentId && ids.has(c.parentId));
  }, [categories, tourTypes]);

  const countries = COUNTRIES.map((c) => ({ ...c, category: bySlug.get(c.slug) })).filter((c) => c.category);

  const selected = new Set(categoryIds);
  const countryIds = new Set(countries.map((c) => c.category!.id));
  const regionIds = new Set(allRegions.map((r) => r.id));
  const tourTypeIds = new Set(tourTypes.map((t) => t.category.id));

  // Nepal shares a category with the "Tours, Holidays and Safari" tour type, so picking Nepal
  // must not add that category (it would tick the tour type too). Nepal is instead chosen by the
  // package destination: it counts as picked when no other country is and the destination (or the
  // shared category, for packages saved earlier) points at it.
  const nepal = countries.find((c) => c.slug === "nepal-tour-packages");
  const otherCountry = countries.find((c) => c.slug !== "nepal-tour-packages" && selected.has(c.category!.id));
  const nepalPicked = !!nepal && (destinationId === nepal.category!.id || selected.has(nepal.category!.id));
  const selectedCountry = otherCountry ?? (nepalPicked ? nepal : undefined);
  const selectedRegion = allRegions.find((r) => selected.has(r.id));
  // Only regions of the chosen tour type(s). Nepal trekking regions also need Nepal (or no country) picked.
  const nepalOk = !selectedCountry || selectedCountry.slug === "nepal-tour-packages";
  const regions = allRegions.filter((r) => {
    if (!selected.has(r.parentId as string)) return false;
    const parent = tourTypes.find((t) => t.category.id === r.parentId);
    return parent && isBuiltInTourType(parent.category) ? nepalOk : true;
  });

  const apply = (nextCategoryIds: string[]) => {
    const unique = [...new Set(nextCategoryIds)];
    const region = allRegions.find((r) => unique.includes(r.id));
    const country = countries.find((c) => c.slug !== "nepal-tour-packages" && unique.includes(c.category!.id))
      ?? countries.find((c) => c.slug === "nepal-tour-packages");
    const destination = region?.id ?? country?.category?.id ?? destinationId;
    onChange({ categoryIds: unique, destinationId: destination });
  };

  const toggleTourType = (id: string) =>
    apply(selected.has(id) ? categoryIds.filter((x) => x !== id) : [...categoryIds, id]);

  const chooseCountry = (slug: string) => {
    const next = countries.find((c) => c.slug === slug);
    if (!next?.category) return;
    const nextCategoryId = next.category.id;
    // Drop other countries (keep a shared Nepal/tours category if it is also a tour type) and any region.
    const keepTourTypes = categoryIds.filter((id) => tourTypeIds.has(id));
    const rest = categoryIds.filter((id) => !countryIds.has(id) && !regionIds.has(id) && !tourTypeIds.has(id));
    // Nepal only sets the destination — adding its (shared) category would also tick "Tours, Holidays and Safari".
    if (next.slug === "nepal-tour-packages") {
      onChange({ categoryIds: [...rest, ...keepTourTypes], destinationId: nextCategoryId });
      return;
    }
    apply([...rest, ...keepTourTypes, nextCategoryId]);
  };

  const chooseRegion = (id: string) => {
    const rest = categoryIds.filter((x) => !regionIds.has(x));
    apply(id ? [...rest, id] : rest);
  };

  const showRegions = regions.length > 0;
  const summary = [
    tourTypes.filter((t) => selected.has(t.category.id)).map((t) => t.label).join(", "),
    selectedCountry?.label,
    selectedRegion?.title,
  ].filter(Boolean);

  if (!typeId) return null;

  return (
    <div className="sm:col-span-2 rounded-2xl border border-[#efe6da] bg-site-row p-5">
      <div className="mb-4 flex items-center gap-2 text-logo-navy-dark">
        <MapPin className="size-4" />
        <h3 className="font-display text-base font-bold">Where does this trip go?</h3>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">1. Tour type</p>
          <div className="flex flex-wrap gap-2">
            {tourTypes.map((t) => (
              <Chip key={t.slug} active={selected.has(t.category.id)} onClick={() => toggleTourType(t.category.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">2. Country</p>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <Chip key={c.slug} active={selectedCountry?.slug === c.slug} onClick={() => chooseCountry(c.slug)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        {showRegions && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">3. Region (for the tour type you picked)</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={!selectedRegion} onClick={() => chooseRegion("")}>
                No region
              </Chip>
              {regions.map((r) => (
                <Chip key={r.id} active={selectedRegion?.id === r.id} onClick={() => chooseRegion(r.id)}>
                  {r.title}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-on-surface-variant">
        {summary.length > 0
          ? `This package will be listed under: ${summary.join(" › ")}. The package destination is set from your country and region.`
          : "Pick a tour type and country. The package destination below is filled in for you."}
      </p>
    </div>
  );
}
