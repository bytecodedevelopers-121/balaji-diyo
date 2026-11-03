import { TextToSpeechPlayer } from "@/components/ui/TextToSpeechPlayer";
import { publicEnv } from "@/lib/env";
import { buildNarrationScript, type PackageDetail } from "../data";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { CompareButton } from "./CompareButton";
import { SharePopover } from "./SharePopover";
import { StarIcon } from "./icons";

/**
 * Breadcrumb, title, rating, quick actions and the lead summary paragraph.
 * A plain Server Component — it can import `publicEnv` (server-only) directly
 * for the share URL.
 */
export function TripTitleBar({ trip }: { trip: PackageDetail }) {
  return (
    <div className="w-full pt-5 pb-2">
      {trip.breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-brand-neutral-700">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {trip.breadcrumb.map((crumb, index) => (
              <li key={`${crumb}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">→</span> : null}
                <span className={index === trip.breadcrumb.length - 1 ? "text-brand-neutral-1000" : undefined}>{crumb}</span>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <h1 className="text-[clamp(30px,5vw,46px)] leading-tight font-bold text-brand-neutral-1000">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-body-m">
              <StarIcon className="size-5 text-[#ffa11d]" />
              <span className="font-medium text-brand-neutral-1000">{trip.rating.toFixed(1)}</span>
              <span className="font-medium text-[#006eff]">{trip.reviewCount} reviews</span>
            </span>
            <TextToSpeechPlayer text={buildNarrationScript(trip)} label={trip.title} />
          </div>
        </div>

        {/*
          Figma's mobile frame packs these three into one row at a
          much tighter pill size than the desktop version.
        */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CompareButton slug={trip.slug} title={trip.title} />
          <DownloadPdfButton slug={trip.slug} />
          <SharePopover url={`${publicEnv.NEXT_PUBLIC_SITE_URL}/${trip.slug}`} title={trip.title} />
        </div>
      </div>

      <p className="mt-5 max-w-[860px] text-[17px] leading-[1.8] text-brand-neutral-900">{trip.intro}</p>
    </div>
  );
}
