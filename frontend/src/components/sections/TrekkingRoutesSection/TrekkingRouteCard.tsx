import Link from "next/link";
import type { TrekkingRoute } from "@/features/trekking-routes/types/trekking-route.types";
import { FillImage } from "@/components/ui/FillImage";

/**
 * One card in the grid (design-references/trekking-route.png, y≈1210–
 * 1620 at 1440px) — the route's own map graphic, then title + "View
 * Map →". No per-card border/rounding in the design; only the grid's
 * own outer frame plus thin dividers between cells (see
 * TrekkingRoutesSection).
 */
export function TrekkingRouteCard({ route }: { route: TrekkingRoute }) {
  if (!route.slug) return null;

  return (
    <Link
      href={`/map/${route.slug}`}
      className="group flex flex-col bg-brand-neutral-000"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-neutral-100">
        {route.mapImageUrl ? (
          <FillImage
            src={route.mapImageUrl}
            alt={route.mapTitle}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        ) : (
          <div className="flex size-full items-center justify-center font-poppins text-body-m text-brand-neutral-600">
            Map coming soon
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-6">
        <p className="font-poppins text-[18px] leading-[1.3] font-bold text-brand-neutral-1000">
          {route.mapTitle}
        </p>
        <span className="flex items-center gap-2 font-poppins text-[14px] leading-[22.4px] font-medium text-secondary-500">
          View Map
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 transition-transform group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
