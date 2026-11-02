import type { ComponentType } from "react";
import type { PackageDetail } from "../data";
import { BusIcon, DocumentIcon, FoodIcon, HealthIcon, HikerIcon, HotelIcon, IdCardIcon, InfoIcon, MapIcon, SignpostIcon, UsersIcon } from "./icons";

/**
 * Icon keys an admin can pick on a cost category (kept in sync by hand with
 * the admin's `COST_CATEGORY_ICONS` list). Legacy rows with no category icon
 * fall back to a guess from the category name.
 */
const ICONS_BY_KEY: Record<string, ComponentType<{ className?: string }>> = {
  transportation: BusIcon,
  accommodation: HotelIcon,
  food: FoodIcon,
  guide: UsersIcon,
  permits: SignpostIcon,
  gear: HikerIcon,
  document: DocumentIcon,
  "id-card": IdCardIcon,
  health: HealthIcon,
  map: MapIcon,
  info: InfoIcon,
};

const ICONS_BY_NAME: Record<string, string> = {
  Food: "food",
  "Food & Extras": "food",
  Accommodation: "accommodation",
  Transportation: "transportation",
  "Guide & Staff": "guide",
  "Permits & Documents": "permits",
  Gear: "gear",
};

/**
 * "What is included / excluded in this trek package?" — grouped by
 * category card, matching Figma nodes 1000006517 and 1000006645. Both
 * use the same light-blue treatment in the design; include items get a
 * check, exclude items get a cross for clarity.
 */
function CategoryCard({ category, icon, html, variant }: { category: string; icon?: string | null; html: string; variant: "include" | "exclude" }) {
  const CategoryIcon = ICONS_BY_KEY[icon ?? ICONS_BY_NAME[category] ?? ""] ?? InfoIcon;
  return (
    <div className="rounded-2xl border border-[#fbc99d] bg-white p-5">
      <h3 className="flex items-center gap-2.5 border-b border-primary-300 pb-3 font-poppins text-heading-xl font-medium text-brand-neutral-900">
        <CategoryIcon className="size-5 text-primary-500" />
        {category}
      </h3>
      {/* Admin-authored rich text. Lists get the design's check/cross bullets (see `.cost-list-*` in globals.css). */}
      <div
        className={`cost-list cost-list-${variant} mt-3 font-poppins text-body-l text-brand-neutral-900 [&_p]:mb-2 [&_strong]:font-bold [&_b]:font-bold [&_a]:text-primary-600 [&_a]:underline`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function InclusionsSection({ trip }: { trip: PackageDetail }) {
  return (
    <div className="flex flex-col gap-8">
      <section id="includes" className="rounded-2xl border border-[#fbc99d] bg-[#e5f0ff] p-4">
        <h2 className="text-center font-poppins text-raleway-3xl font-medium text-[#006eff]">What is included in this trek package?</h2>
        <div className="mt-4 flex flex-col gap-4">
          {trip.includes.map((group) => (
            <CategoryCard key={group.category} category={group.category} icon={group.icon} html={group.html} variant="include" />
          ))}
        </div>
      </section>

      <section id="excludes" className="rounded-2xl border border-[#fbc99d] bg-[#e5f0ff] p-4">
        <h2 className="text-center font-poppins text-raleway-3xl font-medium text-[#006eff]">What is excluded in this trek package?</h2>
        <div className="mt-4 flex flex-col gap-4">
          {trip.excludes.map((group) => (
            <CategoryCard key={group.category} category={group.category} icon={group.icon} html={group.html} variant="exclude" />
          ))}
        </div>
      </section>
    </div>
  );
}
