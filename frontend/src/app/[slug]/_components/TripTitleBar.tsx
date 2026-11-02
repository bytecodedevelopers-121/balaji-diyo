import { TextToSpeechPlayer } from "@/components/ui/TextToSpeechPlayer";
import { publicEnv } from "@/lib/env";
import { buildNarrationScript, type PackageDetail } from "../data";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { CompareButton } from "./CompareButton";
import { SharePopover } from "./SharePopover";
import { StarIcon } from "./icons";

/**
 * Title/rating/quick-actions row — split out of `TripHeader` (2026-09-02,
 * client-requested restructure). `<TabNav>` now renders directly below
 * the hero photo, with this row right after it instead of before it —
 * `id="overview"` lives here, not on `HighlightsAndOverview` below, so
 * clicking the Overview tab lands on the trip's name/rating/actions
 * first thing, with the actual overview copy following right after it,
 * instead of jumping straight into that copy with no title in view.
 *
 * A plain Server Component, same as `TripHeader` was before the split —
 * none of its children (TextToSpeechPlayer, the action buttons) need
 * this file itself to be a Client Component to render them, so it can
 * import `publicEnv` (server-only, see that module's own doc comment)
 * directly for the share URL rather than needing it threaded down as a
 * prop from somewhere else.
 */
export function TripTitleBar({ trip }: { trip: PackageDetail }) {
  return (
    <div
      id="overview"
      className="flex w-full flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h1 className="font-poppins text-raleway-4xl font-medium text-brand-neutral-1000">
          {trip.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 font-poppins text-body-m">
            <StarIcon className="size-5 text-[#ffa11d]" />
            <span className="font-medium text-brand-neutral-1000">
              {trip.rating.toFixed(1)}
            </span>
            <span className="font-medium text-[#006eff]">
              {trip.reviewCount} reviews
            </span>
          </span>
          <TextToSpeechPlayer
            text={buildNarrationScript(trip)}
            label={trip.title}
          />
        </div>
      </div>

      {/*
        Figma's mobile frame packs these three into one row at a
        much tighter pill size than the desktop version (px-5/py-2.5
        gap-3/text-body-m) — kept as-is above `sm`, but at that size
        on a narrow phone the row runs well past the viewport width.
      */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <CompareButton
          slug={trip.slug}
          title={trip.title}
        />
        <DownloadPdfButton slug={trip.slug} />
        <SharePopover
          url={`${publicEnv.NEXT_PUBLIC_SITE_URL}/${trip.slug}`}
          title={trip.title}
        />
      </div>
    </div>
  );
}
