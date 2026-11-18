import Link from "next/link";
import { ArrowRight, Mountain, Quote, Star } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { getFeaturedTestimonials } from "@/features/testimonials/api/get-testimonials";
import { HOME_DEFAULTS, type ClientReviewsContent } from "@/features/page-content/home-defaults";
import { TiltCard } from "./TiltCard";

/**
 * "What Our Clients Say?" — centred heading, review-platform ratings and three
 * slightly tilted review cards. Cards come from the admin's featured testimonials
 * (`isFeatured`); the section is hidden when there are none.
 */
interface ReviewCard {
  id: string;
  name: string;
  country: string;
  date: string;
  rating: number;
  title: string;
  /** Rich-text HTML from the CMS. */
  body: string;
}

/** Brand colour of each review platform's stars, matched by name. */
const PLATFORM_COLORS: Record<string, string> = {
  tripadvisor: "text-[#00aa6c]",
  "google reviews": "text-[#fbbc04]",
  trustpilot: "text-[#00b67a]",
};

/** Resting tilt (degrees) of each card, repeating. */
const ANGLES = [-1.5, 1, -1];

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

export async function ClientReviewsSection({ content = HOME_DEFAULTS.clientReviews }: { content?: ClientReviewsContent }) {
  const featured = await getFeaturedTestimonials(content.maxCards).catch(() => []);
  const cards: ReviewCard[] = featured.map((t) => ({
    id: t.id,
    name: t.fullName,
    country: t.countryName,
    date: t.reviewDate ? dateFormat.format(new Date(t.reviewDate)) : "",
    rating: Number(t.reviewRating) || 5,
    title: t.reviewTitle || t.fullName,
    body: t.reviewAbstract || t.review,
  }));
  if (cards.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-site-bg px-4 pt-12 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="relative mx-auto w-full max-w-[1100px]">
        <div className="flex flex-col items-center text-center">
          <p className="inline-flex items-center gap-2 rounded-pill border border-logo-sun/50 bg-logo-sun/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-logo-navy uppercase">
            <Mountain aria-hidden="true" className="size-3.5" />
            {content.badge}
          </p>
          <h2 className="font-playfair-display mt-5 text-[clamp(30px,6vw,48px)] leading-[1.1] font-bold text-logo-navy-dark">
            {content.titleLine1}
            <span className="block text-logo-sun italic">{content.titleLine2}</span>
          </h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {content.platforms.map((platform) => (
              <li key={platform.name} className="text-[13px] font-bold text-brand-neutral-900">
                {platform.name}
                <span className="flex items-center justify-center gap-1.5 text-[11px] font-normal text-brand-neutral-800">
                  <span className={`flex ${PLATFORM_COLORS[platform.name.toLowerCase()] ?? "text-logo-sun"}`} aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-3 fill-current" />
                    ))}
                  </span>
                  {platform.meta}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <TiltCard key={card.id} angle={ANGLES[i % ANGLES.length]}>
              <Quote aria-hidden="true" className="size-5 fill-logo-sun text-logo-sun" />
              <h3 className="mt-4 text-[15px] leading-snug font-bold text-logo-navy-dark">{card.title}</h3>
              <div
                className="mt-2 line-clamp-6 text-[14px] leading-[1.7] text-brand-neutral-800"
                dangerouslySetInnerHTML={{ __html: card.body }}
              />
              <Link href="/reviews" className="mt-2 inline-block text-[12px] font-semibold text-logo-navy hover:underline">
                read more »
              </Link>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-[#e7dfd2] pt-4">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={card.name} />
                  <p className="text-[13px] font-bold text-brand-neutral-900">
                    {card.name}
                    <span className="block text-[12px] font-normal text-logo-navy">{card.country}</span>
                  </p>
                </div>
                <div className="text-right text-[11px] text-brand-neutral-700">
                  <Stars rating={card.rating} />
                  {card.date}
                </div>
              </div>
            </TiltCard>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link
            href={content.buttonHref}
            className="inline-flex items-center gap-2 rounded-pill border border-logo-sun bg-brand-neutral-000 px-5 py-2 text-[12px] font-semibold text-logo-navy transition-colors hover:bg-logo-sun"
          >
            {content.buttonLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
