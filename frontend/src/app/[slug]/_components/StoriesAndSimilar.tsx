import { tripHref } from "@/lib/trip-href";
import Image from "next/image";
import Link from "next/link";
import type { PackageDetail } from "../data";
import { PlayIcon, StarIcon } from "./icons";

/**
 * "Traveler Stories" (video-style cards with a centered play button,
 * inside the same white/peach-bordered card shell as every other tab
 * section — Figma node 1000006638) and "Similar Packages" (trip cards
 * under a Playfair Display heading — Figma node 1000006084).
 */
export function StoriesAndSimilar({ trip }: { trip: PackageDetail }) {
  return (
    <>
      {/*
        FIXED 2026-09-03 (part of the same section-gap pass as
        PackageDetailView.tsx/AboutSection.tsx): this block used to carry
        only `pb-10` — no top padding at all — so whenever a trip has
        stories, "Traveler Stories" sat flush against the FAQ block right
        above it while every other section on this page had a real gap.
        `pt-[26px]`/`pb-[34px]` now brackets it with the same rhythm the
        rest of this pass uses (a follow-up "reduce 5,6px more" trimmed
        the original `pt-8`/`pb-10` by the same 6px as everywhere else
        in this pass — see AboutSection.tsx's own comment).
      */}
      {trip.stories.length > 0 ? (
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-[26px] pb-[34px] md:px-16">
        <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
          <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Traveler Stories</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {trip.stories.map((story) => (
              <div key={story.title} className="group relative aspect-4/5 overflow-hidden rounded-2xl bg-brand-neutral-300">
                <Image
                  src={story.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
                <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white">
                  <PlayIcon className="size-4 translate-x-0.5 text-brand-neutral-1000" />
                </span>
                <p className="absolute right-4 bottom-4 left-4 font-poppins text-body-m font-medium text-white">{story.title}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      ) : null}

      {/* `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's
          own comment (2026-09-03, two passes). */}
      {trip.similarPackages.length > 0 ? (
      <section className="py-[50px]">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-16">
          <h2 className="font-playfair-display text-playfair-lg font-medium text-brand-neutral-1000">Similar Packages</h2>
          <p className="mt-3 font-poppins text-body-l font-medium text-brand-neutral-700">
            A handpicked selection of trips for the upcoming season, across Nepal, Bhutan, and Tibet.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {trip.similarPackages.map((pkg) => (
              <Link key={pkg.slug} href={tripHref(pkg.slug)} className="group relative aspect-4/3.75 overflow-hidden rounded-2xl">
                <Image
                  src={pkg.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0" style={{ backgroundImage: "var(--gradient-photo-scrim)" }} aria-hidden="true" />
                <span className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white text-brand-neutral-1000">
                  ↗
                </span>
                <div className="absolute right-5 bottom-5 left-5 text-brand-neutral-1000">
                  <div className="flex flex-wrap items-center gap-3 font-poppins text-body-s font-medium">
                    <span className="rounded-pill bg-white px-3 py-1">{pkg.duration}</span>
                    <span className="flex items-center gap-1 rounded-pill bg-white px-3 py-1">
                      <StarIcon className="size-3.5 text-secondary-500" />
                      {pkg.rating}
                    </span>
                  </div>
                  <p className="mt-3 rounded-2xl bg-white/90 px-4 py-3 font-poppins text-2xl font-medium">
                    {pkg.title}
                    <span className="mt-1 block font-poppins text-body-m font-medium text-brand-neutral-700">
                      from <span className="font-medium text-brand-neutral-1000">{pkg.priceFrom}</span>
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </>
  );
}
