import { ExternalLink, Clock, Mountain, Users, Compass, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Package } from "@/types/package";

/** Where the public site lives, so "View on site" can link to the trip page. */
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000";

const toNumber = (value: string | number | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-brand-orange">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

/**
 * Summary banner above the package editor, mirroring the top of the public
 * trip page: title, destination, status and the quick facts visitors see first
 * (duration, difficulty, group size, altitude, price from).
 */
export function PackageHero({ pkg }: { pkg: Package }) {
  const prices = pkg.priceGroups
    .map((g) => toNumber(g.offerUnitPrice) ?? toNumber(g.unitPrice))
    .filter((p): p is number => p !== undefined && p > 0);
  const priceFrom = prices.length ? Math.min(...prices) : toNumber(pkg.price);
  const duration = toNumber(pkg.duration);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand-surface p-6 text-white shadow-sm sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_85%_10%,rgba(247,132,30,0.35),transparent_30%),linear-gradient(155deg,transparent_0_55%,rgba(7,140,191,0.4)_55.2%_66%,transparent_66.2%)]"
      />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-brand-orange uppercase">{pkg.destination?.title ?? "Package"}</p>
            <h2 className="font-display text-2xl leading-tight font-bold sm:text-3xl">{pkg.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge label={pkg.isActive ? "Published" : "Hidden"} variant={pkg.isActive ? "green" : "gray"} />
              {pkg.isPopular && <Badge label="Best Seller" variant="yellow" />}
              {pkg.isFeatured && <Badge label="Featured" variant="blue" />}
            </div>
          </div>

          {pkg.slug && (
            <a
              href={`${SITE_URL}/${pkg.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25"
            >
              View on site
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat icon={<Clock className="size-4" />} label="Duration" value={duration ? `${duration} ${pkg.durationType}` : "Not set"} />
          <Stat icon={<Compass className="size-4" />} label="Difficulty" value={pkg.grade?.title ?? "Not set"} />
          <Stat icon={<Users className="size-4" />} label="Group size" value={pkg.groupSize ?? "Not set"} />
          <Stat icon={<Mountain className="size-4" />} label="Max altitude" value={pkg.maxAltitude ?? "Not set"} />
          <Stat icon={<Tag className="size-4" />} label="Price from" value={priceFrom ? `US$${priceFrom.toLocaleString()}` : "Not set"} />
        </div>
      </div>
    </section>
  );
}
