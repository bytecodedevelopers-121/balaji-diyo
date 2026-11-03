"use client";

import { useState } from "react";
import { Backpack, Info } from "lucide-react";
import { CmsProse } from "@/components/ui/CmsProse";
import type { PackageDetail } from "../data";
import { hasRichContent } from "../has-rich-content";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { ChevronDownIcon } from "./icons";
import { EmptyNote, SectionRow, STAR_BULLETS } from "./SectionRow";

/**
 * "Equipment & Packing" — the trip's packing list (one rich-text block
 * authored in admin) in the label-left layout, with star-bookmark bullets and
 * a Download link for the brochure PDF. Shows a placeholder when empty.
 */
export function EquipmentSection({ trip }: { trip: PackageDetail }) {
  return (
    <SectionRow id="gear" label="Equipments" icon={<Backpack aria-hidden="true" className="size-14" strokeWidth={1} />}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[28px] leading-tight font-bold text-brand-neutral-900">Equipment &amp; Packing</h3>
        <DownloadPdfButton slug={trip.slug} compact />
      </div>
      {hasRichContent(trip.packingListIntro) ? (
        <CmsProse
          html={trip.packingListIntro}
          className={`mt-4 text-[14px] leading-[1.7] ${STAR_BULLETS} [&_h2]:font-poppins! [&_h2]:text-[15px]! [&_h2]:font-bold! [&_h2]:mt-6! [&_h3]:font-poppins! [&_h3]:text-[14px]! [&_h3]:font-bold! [&_h3]:mt-6! [&_h4]:text-[14px]! [&_h4]:mt-5! [&_li]:text-[14px]`}
        />
      ) : (
        <div className="mt-4">
          <EmptyNote>The equipment list for this trip will be added soon.</EmptyNote>
        </div>
      )}
    </SectionRow>
  );
}

/** "Know Before You Go" — an expandable accordion of practical notes (matches Figma node 1000006523). */
export function PracticalInfoSection({ trip }: { trip: PackageDetail }) {
  const [openHeadings, setOpenHeadings] = useState<string[]>(trip.knowBeforeYouGo.map((entry) => entry.heading));

  function toggleHeading(heading: string) {
    setOpenHeadings((prev) => (prev.includes(heading) ? prev.filter((h) => h !== heading) : [...prev, heading]));
  }

  return (
    <SectionRow
      id="know-before-you-go"
      label="Practical Info"
      icon={<Info aria-hidden="true" className="size-14" strokeWidth={1} />}
    >
      {trip.knowBeforeYouGo.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-6">
            <h3 className="text-[28px] leading-tight font-bold text-brand-neutral-900">Know Before You Go</h3>
            <button
              type="button"
              onClick={() =>
                setOpenHeadings((prev) =>
                  prev.length === trip.knowBeforeYouGo.length ? [] : trip.knowBeforeYouGo.map((entry) => entry.heading),
                )
              }
              className="text-body-l font-medium text-brand-neutral-900"
            >
              Expand all
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {trip.knowBeforeYouGo.map((entry) => {
              const isOpen = openHeadings.includes(entry.heading);
              return (
                <div key={entry.heading} className="rounded-xl border border-[#fbdec1] bg-[#fef7f0] p-4">
                  <button
                    type="button"
                    onClick={() => toggleHeading(entry.heading)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="font-raleway text-body-l font-semibold text-brand-neutral-900">{entry.heading}</span>
                    <ChevronDownIcon className={`size-5 shrink-0 text-brand-neutral-700 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen ? <CmsProse html={entry.body} className="mt-2" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyNote>Practical information for this trip will be added soon.</EmptyNote>
      )}
    </SectionRow>
  );
}
