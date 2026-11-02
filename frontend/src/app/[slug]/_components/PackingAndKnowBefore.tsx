"use client";

import { useState } from "react";
import { CmsProse } from "@/components/ui/CmsProse";
import type { PackageDetail } from "../data";
import { hasRichContent } from "../has-rich-content";
import { ChevronDownIcon } from "./icons";

/**
 * "Packing List" (now a single rich-text block, not a filterable-by-
 * category checklist — 2026-09-03, direct request: "let's just have a
 * tiptap editor section for this instead of separating into diff
 * categories", superseding Figma node 1000006522's original checklist
 * design from earlier the same day) and "Know Before You Go" (an
 * accordion, unaffected — matches Figma node 1000006523).
 */
export function PackingAndKnowBefore({ trip }: { trip: PackageDetail }) {
  const [openHeadings, setOpenHeadings] = useState<string[]>(trip.knowBeforeYouGo.map((entry) => entry.heading));

  function toggleHeading(heading: string) {
    setOpenHeadings((prev) => (prev.includes(heading) ? prev.filter((h) => h !== heading) : [...prev, heading]));
  }

  return (
    <div className="flex flex-col gap-8">
      {hasRichContent(trip.packingListIntro) ? (
      <section id="gear" className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
        <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Packing List</h2>
        <CmsProse html={trip.packingListIntro} className="mt-4" />
      </section>
      ) : null}

      {trip.knowBeforeYouGo.length > 0 ? (
      <section id="know-before-you-go" className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
        <div className="flex items-center justify-between gap-6">
          <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Know Before You Go</h2>
          <button
            type="button"
            onClick={() =>
              setOpenHeadings((prev) =>
                prev.length === trip.knowBeforeYouGo.length ? [] : trip.knowBeforeYouGo.map((entry) => entry.heading),
              )
            }
            className="font-poppins text-body-l font-medium text-brand-neutral-900"
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
      </section>
      ) : null}
    </div>
  );
}
