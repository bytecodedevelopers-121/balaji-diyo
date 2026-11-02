import Link from "next/link";
import { CmsProse } from "@/components/ui/CmsProse";
import type { PackageDetail } from "../data";
import { ItineraryPhotoGallery } from "./ItineraryPhotoGallery";
import { BusIcon, ClockIcon, FoodIcon, HikerIcon, InfoIcon, MountainIcon, MountainSnowIcon } from "./icons";

/**
 * "Day-to-Day Short Itinerary" table, the "Lukla Flight Information" and
 * "Note" callouts, and the full "Detailed Itinerary" day-by-day cards —
 * matches Figma nodes 1000006501, 1000006640, 1000006502, 1000006505, and
 * the individual day cards (1000006514 etc). Figma renders every day as
 * its own full-width card rather than grouping by trail leg, so the
 * per-leg `image`/`title` grouping in the data is flattened here.
 */
export function ItinerarySection({ trip }: { trip: PackageDetail }) {
  const days = trip.detailedItinerary.flatMap((leg) => leg.days);

  // "Lukla Flight Information" is real, generic-but-accurate boilerplate
  // for any trek that actually flies through Lukla — but it was
  // hardcoded to render on every package page regardless, including
  // treks (Annapurna, Langtang, ...) that never go near Lukla. No
  // backend field exists yet to say "this package flies through Lukla",
  // so this checks the one real signal already in the data: does any
  // day's title or place pill actually mention it.
  const fliesViaLukla =
    trip.shortItinerary.some((day) => day.title.toLowerCase().includes("lukla")) ||
    days.some(
      (day) =>
        day.title.toLowerCase().includes("lukla") ||
        day.locations.some((loc) => loc.label.toLowerCase().includes("lukla")),
    );

  return (
    // `gap-[4px]` — tightened 2026-09-14 (direct request, "all the section
    // gaps"), was `gap-8`; matches the same pass on PackageDetailView.tsx's
    // own tab-content rhythm (see its comment for the fuller history).
    <section className="flex flex-col gap-[4px]">
      <div className="rounded-2xl border border-[#fbc99d] bg-[#fef7f0] p-4 shadow-card-strong sm:p-8">
        <h2 className="text-raleway-3xl font-poppins font-medium text-brand-neutral-1000">Day-to-Day Short Itinerary</h2>
        <div className="mt-4 flex flex-col gap-3.5">
          {/*
            One row per day at every width — Day / Title / Altitude /
            Duration side by side, dashed dividers, light-cyan fill.
            `items-start` (not `-center`) on every cell so the day
            number/altitude/duration line up with the top of the title
            text instead of floating to the middle once the title wraps
            to 2–3 lines; the divider is `border-r-2` rather than the
            thinner default because a 1px dashed rule reads as an
            almost-solid line at this scale. Day/Altitude/Duration are
            narrower than the first pass so Title — the column that
            actually needs the room for a full day's description — gets
            more of the row.
          */}
          {trip.shortItinerary.map((day) => (
            <div
              key={day.day}
              className="flex items-stretch overflow-hidden rounded-[10px] bg-[#eaf6ff]"
            >
              <span className="flex w-16 shrink-0 items-start border-r-2 border-dashed border-primary-200 px-2 py-4 font-poppins text-body-m font-medium text-primary-500 sm:w-24 sm:px-4 sm:py-5 sm:text-body-l">
                Day {String(day.day).padStart(2, "0")}
              </span>
              <span className="flex flex-1 items-start border-r-2 border-dashed border-primary-200 px-2 py-4 font-poppins text-body-m font-medium text-brand-neutral-900 sm:px-4 sm:py-5 sm:text-body-l">
                {day.title}
              </span>
              <span className="flex w-16 shrink-0 items-start border-r-2 border-dashed border-primary-200 px-2 py-4 font-poppins text-body-m font-medium text-brand-neutral-900 sm:w-28 sm:px-4 sm:py-5 sm:text-body-l">
                {day.altitudeM.toLocaleString()}m
              </span>
              <span className="flex w-16 shrink-0 items-start px-2 py-4 font-poppins text-body-m font-medium text-brand-neutral-900 sm:w-32 sm:px-4 sm:py-5 sm:text-body-l">
                {day.durationHours > 0 ? `~${day.durationHours} hrs` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {fliesViaLukla ? (
        <div className="rounded-2xl bg-[#d6e8ff] p-4 sm:p-8">
          <h3 className="font-poppins text-heading-xl font-medium text-brand-neutral-1000">Lukla Flight Information</h3>
          <p className="mt-4 font-poppins text-body-l font-medium text-brand-neutral-900">
            During peak trekking months (March, April, May, October, and November), flights to Lukla often depart from
            Ramechhap (Manthali) instead of Kathmandu because of airport traffic. In this case, you&apos;ll need to
            leave Kathmandu around 12:30 a.m. for a five-hour drive to catch your flight from Ramechhap on the trek
            departure date. Outside of peak seasons, flights usually operate directly from Kathmandu. Flights between
            Kathmandu and Lukla can be delayed due to weather, so adding at least two extra days to your trip is a
            good idea to avoid missing your international flight home.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl bg-primary-200 p-4 sm:p-8">
        <h3 className="font-poppins text-heading-xl font-medium text-brand-neutral-1000">Note</h3>
        <p className="mt-4 font-poppins text-body-l font-medium text-brand-neutral-900">
          We recommend you arrive at Kathmandu by three pm at least one day before the trek departure date for
          last-minute preparations.
        </p>
      </div>

      {/*
        Figma spec (matches the original exported node's own
        `stroke="#F5F5F5"` + `filter0_dd` double drop-shadow, not the
        orange-border/`shadow-card-strong` treatment every plain-color
        card elsewhere on this page uses): 16px radius, 1px `#F5F5F5`
        border, 32px padding, and two stacked shadows —
        `4px 4px 18px -6px #0000001A` and `-4px 0px 18px -6px #0000001A`.
      */}
      {/*
        `bg-[#f5f2e3]` (not `bg-white`) — the torn-paper PNG is a real
        cutout with actual alpha-transparent gaps between the "teeth" of
        its torn top edge (~9% of that band, confirmed by sampling the
        asset), not just an irregular opaque silhouette. Over `bg-white`
        those gaps showed as stark white slivers poking through the
        texture; `#f5f2e3` is this asset's own sampled opaque body color,
        so the transparent notches now blend into the same cream instead
        of standing out.
      */}
      <div className="relative isolate overflow-hidden rounded-2xl border border-[#F5F5F5] bg-[#f5f2e3] p-4 shadow-[4px_4px_18px_-6px_#0000001A,-4px_0px_18px_-6px_#0000001A] sm:p-8">
        {/*
          Whole-card background, per design feedback (object-cover was
          tried first and cropped almost all the texture away on this
          tall card, since it zooms to cover height and the image is a
          wide/short strip — see git history). No object-fit utility here
          means the default `object-fit: fill`, which stretches
          non-uniformly to exactly match the image's own box instead of
          cropping — so the torn edges stay visible at all four sides
          regardless of the card's own aspect ratio.

          A follow-up pass tried growing the image past the container
          (`h-[115%]`/`h-[130%]` + a negative top offset) to reduce that
          stretch, but per the actual Figma reference the scalloped top
          edge needs to run intact across the *entire* card width — any
          vertical overscan crops most of that detail off, leaving only a
          sliver on one side. Back to plain `size-full` (no crop) so the
          full edge is always in frame.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative torn-paper texture, not real content */}
        <img
          src="/images/itinerary/torn-paper-bg.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 -z-10 size-full"
        />
        <h2 className="text-raleway-3xl font-poppins font-medium text-brand-neutral-1000">Detailed Itinerary</h2>
        <CmsProse
          html={trip.detailedItineraryIntro}
          className="mt-4"
        />
      </div>

      {/* `gap-[4px]` — tightened 2026-09-14 (direct request, "all the section gaps"), was `gap-8`. */}
      <div className="flex flex-col gap-[4px]">
        {days.map((day) => (
          <article key={day.day} className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-poppins text-heading-xl font-medium text-primary-500">
                  Day {String(day.day).padStart(2, "0")}
                </span>
                <h3 className="font-poppins text-2xl font-medium text-brand-neutral-1000">{day.title}</h3>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {day.locations.map((loc) =>
                  loc.href ? (
                    <Link
                      key={loc.label}
                      href={loc.href}
                      className="flex items-center gap-1.5 rounded-pill border border-primary-200 bg-primary-100 px-3 py-1.5 font-poppins text-body-s font-medium text-primary-500 transition-opacity hover:opacity-80 hover:underline sm:text-body-m"
                    >
                      <InfoIcon className="size-3.5" />
                      {loc.label}
                    </Link>
                  ) : (
                    <span
                      key={loc.label}
                      className="flex items-center gap-1.5 rounded-pill border border-primary-200 bg-primary-100 px-3 py-1.5 font-poppins text-body-s font-medium text-primary-500 sm:text-body-m"
                    >
                      <InfoIcon className="size-3.5" />
                      {loc.label}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-secondary-500/40 py-5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <MountainIcon className="size-5 text-primary-500" />
                </span>
                <div>
                  <p className="font-raleway text-body-m font-bold text-secondary-500">Max Altitude</p>
                  <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">{day.altitudeM.toLocaleString()}m</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <ClockIcon className="size-5 text-primary-500" />
                </span>
                <div>
                  <p className="font-raleway text-body-m font-bold text-secondary-500">Duration</p>
                  <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">
                    {day.durationHours > 0 ? `${day.durationHours} hrs` : "—"}
                  </p>
                </div>
              </div>
              {day.distanceKm !== undefined ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <HikerIcon className="size-5 text-primary-500" />
                  </span>
                  <div>
                    <p className="font-raleway text-body-m font-bold text-secondary-500">Distance</p>
                    <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">{day.distanceKm} km</p>
                  </div>
                </div>
              ) : null}
              {day.transport ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <BusIcon className="size-5 text-primary-500" />
                  </span>
                  <div>
                    <p className="font-raleway text-body-m font-bold text-secondary-500">Transport</p>
                    <p className="font-poppins text-body-m font-medium text-brand-neutral-1000">{day.transport}</p>
                  </div>
                </div>
              ) : null}
              {day.meals ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <FoodIcon className="size-5 text-primary-500" />
                  </span>
                  <div>
                    <p className="font-raleway text-body-m font-bold text-secondary-500">Meals</p>
                    <p className="font-poppins text-body-m font-medium text-brand-neutral-1000">{day.meals}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="mt-5 font-poppins text-body-l font-medium text-brand-neutral-900">{day.description}</p>

            {day.photos ? <ItineraryPhotoGallery photos={day.photos} dayTitle={day.title} /> : null}

            {/*
              Lunch place only renders when that day actually has one —
              most days don't (`lunchPlace`'s own doc comment: nothing in
              the legacy migration backfilled it, so it's still blank on
              most real rows), and a bare "Not specified" line for a field
              that's simply not part of this package's itinerary read as a
              missing/broken value rather than "not applicable here".
              Accommodation, by contrast, always renders — real per-day
              data exists for most packages, and per client feedback the
              slot should never disappear even on the rare day without
              it; falls back to the generic word "Accommodation" rather
              than a "no data" message.
            */}
            <div
              className={`mt-4 grid grid-cols-1 divide-y divide-[#fbdec1] overflow-hidden rounded-2xl border border-[#fbdec1] bg-[#fef7f0] ${day.lunchPlace ? "sm:grid-cols-2 sm:divide-x sm:divide-y-0" : ""}`}
            >
              {day.lunchPlace ? (
                <div className="flex items-center gap-3 p-5">
                  <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-secondary-500">
                    <MountainIcon className="size-5 text-white" />
                  </span>
                  <div>
                    <p className="font-poppins text-body-m font-medium text-secondary-500">Name of lunch place</p>
                    <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">{day.lunchPlace}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3 p-5">
                <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-secondary-500">
                  <MountainSnowIcon className="size-5 text-white" />
                </span>
                <div>
                  <p className="font-poppins text-body-m font-medium text-secondary-500">Accommodation</p>
                  <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">
                    {day.accommodation || "Accommodation"}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
