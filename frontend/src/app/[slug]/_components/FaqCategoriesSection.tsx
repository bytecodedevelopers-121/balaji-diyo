"use client";

import { useState } from "react";
import type { PackageDetail } from "../data";
import { EmptyNote } from "./SectionRow";

/**
 * "FAQs" — one blue heading per category, each question a rounded pill with a
 * "Q1" badge and a plus/minus toggle; the answer opens beneath. All questions
 * start collapsed.
 */
export function FaqCategoriesSection({ trip }: { trip: PackageDetail }) {
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  function toggleQuestion(key: string) {
    setOpenQuestions((prev) => (prev.includes(key) ? prev.filter((q) => q !== key) : [...prev, key]));
  }

  return (
    <section>
      <h3 className="text-[40px] leading-tight font-bold text-brand-neutral-900">FAQs</h3>

      {trip.faqCategories.length === 0 ? (
        <div className="mt-5">
          <EmptyNote>Frequently asked questions for this trip will be added soon.</EmptyNote>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {trip.faqCategories.map((group) => (
            <div key={group.category}>
              <h4 className="text-[24px] leading-tight font-medium text-[#0b6a99]">{group.category}</h4>
              <div className="mt-4 flex flex-col gap-3">
                {group.questions.map((item, index) => {
                  const key = `${group.category}:${item.question}`;
                  const isOpen = openQuestions.includes(key);
                  return (
                    <div key={key} className="overflow-hidden rounded-[29px] bg-[#e1eef6]">
                      <button
                        type="button"
                        onClick={() => toggleQuestion(key)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-4 py-2.5 pr-6 pl-3 text-left"
                      >
                        <span className="grid h-10 min-w-12 shrink-0 place-items-center rounded-full bg-white px-3 text-[15px] font-semibold text-brand-neutral-900">
                          Q{index + 1}
                        </span>
                        <span className="flex-1 text-[19px] leading-snug font-semibold text-brand-neutral-800">
                          {item.question}
                        </span>
                        <span aria-hidden="true" className="text-[26px] leading-none text-brand-neutral-800">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen ? (
                        <p className="px-6 pt-1 pb-5 pl-[84px] text-[16px] leading-relaxed whitespace-pre-line text-brand-neutral-800">
                          {item.answer}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
