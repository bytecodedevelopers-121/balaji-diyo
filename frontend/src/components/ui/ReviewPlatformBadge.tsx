import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewPlatform {
  title: string;
  rating: string;
  iconSrc: string;
  href: string;
  starClassName: string;
}

export const reviewPlatforms: ReviewPlatform[] = [
  {
    title: "Tripadvisor",
    rating: "5.0",
    iconSrc: "/images/testimonials/badge-tripadvisor.png",
    href: "https://www.tripadvisor.com/Attraction_Review-g293890-d4815891-Reviews-Boundless_Adventure-Kathmandu_Kathmandu_Valley_Bagmati_Zone_Central_Region.html",
    starClassName: "text-[#00aa6c]",
  },
  {
    title: "Facebook",
    rating: "4.9",
    iconSrc: "/images/testimonials/badge-facebook.png",
    href: "https://www.facebook.com/Boundlessadventure",
    starClassName: "text-[#1877f2]",
  },
  {
    title: "Google",
    rating: "5.0",
    iconSrc: "/images/testimonials/badge-google.png",
    href: "https://share.google/U5TfZqHFd0tryN9fm",
    starClassName: "text-[#fbbc04]",
  },
  {
    title: "Trustpilot",
    rating: "5.0",
    iconSrc: "/images/testimonials/badge-trustpilot.png",
    href: "https://www.trustpilot.com/review/www.boundlessadventure.com",
    starClassName: "text-[#00b67a]",
  },
];

interface ReviewPlatformBadgeProps {
  platform: ReviewPlatform;
  className?: string;
}

/**
 * Reusable review-platform badge. The platform logo, title, score, and
 * stars remain separate elements so every review surface can resize,
 * link, or restyle the badge without depending on a flattened graphic.
 * The supplied legacy badge crop is used only as the logo source until
 * standalone third-party logo assets are provided.
 */
export function ReviewPlatformBadge({ platform, className }: ReviewPlatformBadgeProps) {
  return (
    <a
      href={platform.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read Joyful Trekking Pvt. Ltd. reviews on ${platform.title}`}
      className={cn(
        "inline-flex h-14 items-center gap-2 rounded-full border border-brand-neutral-300 bg-brand-neutral-100 py-1 pr-4 pl-1 transition-colors hover:border-brand-neutral-500 hover:bg-brand-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-900",
        className,
      )}
    >
      <span className="relative size-11 shrink-0 overflow-hidden rounded-full" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- cropped logo source from the approved reference artwork */}
        <img
          src={platform.iconSrc}
          alt=""
          loading="lazy"
          className="absolute top-1/2 left-0 h-14 w-auto max-w-none -translate-y-1/2"
        />
      </span>
      <span className="min-w-0">
        <span className="block font-poppins text-[11px] leading-4 font-bold uppercase text-brand-neutral-900">
          {platform.title}
        </span>
        <span className="flex items-center gap-1 font-poppins text-xs leading-4 font-semibold text-brand-neutral-800">
          {platform.rating}
          <span className={cn("flex gap-px", platform.starClassName)} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-2.5" fill="currentColor" strokeWidth={1.5} />
            ))}
          </span>
        </span>
      </span>
    </a>
  );
}
