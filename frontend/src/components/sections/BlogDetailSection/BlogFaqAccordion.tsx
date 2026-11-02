"use client";

import { useState } from "react";
import { CmsProse } from "@/components/ui/CmsProse";
import type { FaqBlock } from "@/features/blogs/lib/extract-faq-block";

/**
 * Collapsible Q&A list for a real "FAQ" heading pulled out of a blog
 * post's body by `extractFaqBlock` — the rest of the article still
 * renders as plain `CmsProse`, this only replaces the FAQ heading
 * onward. Same card/accordion visual language as the package detail
 * page's "Know Before You Go" (`PackingAndKnowBefore.tsx`): rounded
 * card, per-item bottom border, chevron that rotates open — reused
 * rather than inventing a second accordion look for this site.
 */
export function BlogFaqAccordion({ faq }: { faq: FaqBlock }) {
  const [openQuestions, setOpenQuestions] = useState<string[]>([faq.items[0]?.question].filter((q): q is string => Boolean(q)));

  function toggle(question: string) {
    setOpenQuestions((prev) => (prev.includes(question) ? prev.filter((q) => q !== question) : [...prev, question]));
  }

  return (
    <div className="rounded-2xl border border-[#fbc99d] bg-white p-6">
      <h2 className="font-poppins text-[26px] leading-[1.3] font-bold text-primary-500">{faq.heading}</h2>
      <div className="mt-2 flex flex-col">
        {faq.items.map((item) => {
          const isOpen = openQuestions.includes(item.question);
          return (
            <div
              key={item.question}
              className="border-b border-brand-neutral-300 py-4 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggle(item.question)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span className="font-poppins text-[18px] leading-[1.4] font-bold text-brand-neutral-1000">
                  {item.question}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`size-5 shrink-0 text-primary-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen ? (
                <CmsProse
                  html={item.answerHtml}
                  className="mt-2 text-body-l text-brand-neutral-700"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
