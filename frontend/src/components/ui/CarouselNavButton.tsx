import { cn } from "@/lib/utils";

interface CarouselNavButtonProps {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  label: string;
  className?: string;
}

/**
 * The prev/next chevron affordance for every horizontal card carousel
 * on the site — a white 50×40px rectangle (not a circle — Figma's own
 * layer inspector has no Radius row for it, i.e. 0) overlaid on the
 * card itself, flush against its `left-0`/`right-0` edge (vertically
 * centered) rather than floating with a gap on either side.
 * Standardized 2026-08-27 from a real design reference and applied
 * everywhere a carousel already existed (`TripsCarousel`,
 * `TripsLineupCarousel`, both previously their own bespoke *outside*-
 * the-row white-circle button, hidden below `md`) and everywhere one
 * didn't yet (Blog, Testimonials).
 *
 * Overlaying the button on the card itself — rather than in the
 * row's outer gutter — is what makes it work on mobile with no extra
 * horizontal margin to spare, which is also why it's shown at every
 * breakpoint here instead of `hidden md:flex`.
 */
export function CarouselNavButton({
  direction,
  onClick,
  disabled,
  label,
  className,
}: CarouselNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 flex h-10 w-[50px] -translate-y-1/2 items-center justify-center bg-brand-neutral-000 text-brand-neutral-1000 shadow-card-soft transition-opacity hover:bg-brand-neutral-100 disabled:opacity-40 disabled:hover:bg-brand-neutral-000",
        direction === "left" ? "left-0" : "right-0",
        className,
      )}
    >
      <ChevronIcon direction={direction} />
    </button>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
