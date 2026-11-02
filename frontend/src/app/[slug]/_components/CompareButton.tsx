"use client";

import { useRouter } from "next/navigation";
import { useComparisonSlugs, toggleComparisonSlug } from "@/features/comparison/comparison-store";
import { CompareIcon } from "./icons";

export function CompareButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const slugs = useComparisonSlugs();
  const isSelected = slugs.includes(slug);

  // Toggling used to just silently add/remove the slug in localStorage
  // with no way back to the comparison page from here on desktop (the
  // page's own link only lived in the mobile nav + footer) — jump
  // straight to /compare-itineraries after every click, add or remove,
  // per explicit product direction over the "collect across pages" flow
  // the page's old empty-state copy described.
  function handleClick() {
    toggleComparisonSlug(slug);
    router.push("/compare-itineraries");
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Remove" : "Add"} ${title} ${isSelected ? "from" : "to"} comparison`}
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-pill border px-3 py-2 font-poppins text-body-s font-medium transition-colors sm:gap-3 sm:px-5 sm:py-2.5 sm:text-body-m ${
        isSelected
          ? "border-primary-500 bg-primary-500 text-white hover:bg-primary-600"
          : "border-secondary-500 text-secondary-500 hover:bg-secondary-50"
      }`}
    >
      <CompareIcon className="size-3.5 sm:size-4.5" />
      {isSelected ? "Remove" : "Compare"}
    </button>
  );
}
