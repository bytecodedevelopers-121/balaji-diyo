import Link from "next/link";
import { ArrowRight, Mountain, Star } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { getFeaturedTestimonials } from "@/features/testimonials/api/get-testimonials";
import { TiltCard } from "./TiltCard";
import { WireframeTerrain } from "./WireframeTerrain";

/**
 * "What Our Clients Say?" — a review-platform bar plus three review cards
 * on a pale-blue panel. Cards come from the admin's featured testimonials
 * (`isFeatured`); when there are none, development shows sample reviews
 * (never in production) and production hides the section.
 */
interface ReviewCard {
  id: string;
  name: string;
  country: string;
  date: string;
  rating: number;
  title: string;
  /** Rich-text HTML from the CMS, or plain sample text. */
  body: string;
}

const PLATFORMS = [
  { name: "Tripadvisor", meta: "287 reviews", color: "text-[#00aa6c]" },
  { name: "Google Reviews", meta: "111 reviews", color: "text-[#fbbc04]" },
  { name: "Trustpilot", meta: "79 reviews", color: "text-[#00b67a]" },
];

const SAMPLE_REVIEWS: ReviewCard[] = [
  {
    id: "r1",
    name: "Mark",
    country: "Australia",
    date: "May 31, 2026",
    rating: 5,
    title: "A rewarding Annapurna adventure with comfortable stays",
    body: "I completed the Comfort Annapurna Circuit Trek in May 2026. For me, the appeal was combining the mountain experience with more comfortable accommodation where available and our guide looked after us every step of the way.",
  },
  {
    id: "r2",
    name: "Katie Marquis",
    country: "Australia",
    date: "May 13, 2026",
    rating: 5,
    title: "Amazing experience",
    body: "Our trekking guide was Saroj and our porter was Uttam. They were both amazing. The hike itself was sweaty work but so worth it. Unfortunately it was too cloudy to see the peaks.",
  },
  {
    id: "r3",
    name: "Debz",
    country: "Australia",
    date: "Apr 12, 2026",
    rating: 5,
    title: "Magical memories - Poon Hill Trek with Chitwan Jungle Safari",
    body: "Incredible experience combining Kathmandu, the Poon Hill trek and Chitwan jungle safari. The trek offered stunning Himalayan views, beautiful villages, and well-managed trails.",
  },
];

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={i < Math.round(rating) ? "size-3.5 fill-logo-sun text-logo-sun" : "size-3.5 text-brand-neutral-400"}
        />
      ))}
    </span>
  );
}

export async function ClientReviewsSection() {
  const featured = await getFeaturedTestimonials(3).catch(() => []);
  const cards: ReviewCard[] =
    featured.length > 0
      ? featured.map((t) => ({
          id: t.id,
          name: t.fullName,
          country: t.countryName,
          date: t.reviewDate ? dateFormat.format(new Date(t.reviewDate)) : "",
          rating: Number(t.reviewRating) || 5,
          title: t.reviewTitle || t.fullName,
          body: t.reviewAbstract || t.review,
        }))
      : process.env.NODE_ENV !== "production"
        ? SAMPLE_REVIEWS
        : [];
  if (cards.length === 0) return null;

  return (
    <section className="bg-site-bg px-4 pt-12 pb-10 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div suppressHydrationWarning className="reveal mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
              <Mountain aria-hidden="true" className="size-4" />
              Joyful Trekking Reviews
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold text-brand-neutral-1000">
              What Our Clients Say?
            </h2>
          </div>
          <p className="hidden items-center gap-2 text-[12px] font-semibold text-brand-neutral-900 sm:flex">
            <span className="grid size-7 place-items-center rounded-full bg-[#00aa6c] text-white">
              <Star aria-hidden="true" className="size-4 fill-current" />
            </span>
            <span>
              Travelers&apos; Choice
              <span className="block font-normal text-logo-navy">2026</span>
            </span>
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[4px] bg-[#dce9f3]">
          <WireframeTerrain />
          <ul className="relative flex flex-wrap gap-x-10 gap-y-3 bg-[#c9dcec]/80 px-5 py-3">
            {PLATFORMS.map((platform) => (
              <li key={platform.name} className="text-[13px] font-bold text-brand-neutral-900">
                {platform.name}
                <span className="flex items-center gap-1.5 text-[11px] font-normal text-brand-neutral-800">
                  <span className={`flex ${platform.color}`} aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </span>
                  {platform.meta}
                </span>
              </li>
            ))}
          </ul>

          <ul className="relative grid grid-cols-1 items-start gap-4 px-5 pt-8 pb-6 md:grid-cols-3">
            {cards.map((card) => (
              <TiltCard key={card.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={card.name} />
                    <p className="text-[12px] font-semibold text-brand-neutral-900">
                      {card.name}
                      <span className="block font-normal text-brand-neutral-700">{card.country}</span>
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-brand-neutral-700">
                    <Stars rating={card.rating} />
                    {card.date}
                  </div>
                </div>
                <h3 className="mt-3 text-[14px] leading-snug font-bold text-brand-neutral-900">{card.title}</h3>
                <div
                  className="mt-2 line-clamp-5 text-[12px] leading-relaxed text-brand-neutral-800"
                  dangerouslySetInnerHTML={{ __html: card.body }}
                />
                <Link href="/reviews" className="mt-2 inline-block text-[12px] font-semibold text-logo-navy hover:underline">
                  read more »
                </Link>
              </TiltCard>
            ))}
          </ul>

          <div className="relative px-5 pb-5">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 rounded-pill border border-logo-sun bg-brand-neutral-000 px-5 py-2 text-[12px] font-semibold text-logo-navy transition-colors hover:bg-logo-sun"
            >
              Read All Reviews
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
