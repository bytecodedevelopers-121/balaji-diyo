"use client";

import { useEffect, useState } from "react";
import type { PackageDetail } from "../data";
import { ChevronDownIcon } from "./icons";
import Link from "next/link";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * "FAQs For <Trip>" — a sticky category rail (General Information,
 * Preparation & Fitness, Permits, Insurance & Visa, Guides & Porters,
 * Accommodation, Food & Drinks, Weather, Health & Safety) beside grouped
 * accordion cards, one per category. Matches the page-level Figma node
 * 1000006523 (distinct from the shorter "Essential Questions" accordion
 * inside the Overview tab — that one is FaqSection.tsx).
 */
export function FaqCategoriesSection({ trip }: { trip: PackageDetail }) {
  const allQuestions = trip.faqCategories.flatMap((group) =>
    group.questions.map((q) => q.question),
  );

  const [activeCategory, setActiveCategory] = useState(
    trip.faqCategories[0]?.category,
  );
  // Start fully expanded — every question open on first load.
  const [openQuestions, setOpenQuestions] = useState<string[]>(allQuestions);
  const [stickyTop, setStickyTop] = useState(0);

  // Track `<TabNav>`'s own live bottom edge (id="trip-tab-nav") rather
  // than the site header's — same idea BookingSidebar uses for its own
  // sticky offset. A hardcoded "header bottom + 70" guess used to stand
  // in for TabNav's height here, which silently goes stale the moment
  // TabNav's own height changes for any reason — reading TabNav's real
  // rendered position instead means this rail can never drift out of
  // sync with whatever's actually stacked above it.
  //
  // `requestAnimationFrame`, not scroll/resize/transitionend listeners —
  // the header's slide is a GSAP tween (`gsap.to(..., { yPercent,
  // duration: 0.3 })`), not a CSS transition, so `transitionend` never
  // fires for it, and a scroll listener alone goes stale for the ~0.3s
  // the tween keeps animating after scrolling itself stops (see TabNav's
  // own comment on its identical effect for the full symptom).
  useEffect(() => {
    let frame: number;
    let lastBottom = -1;

    function syncStickyTop() {
      const tabNav = document.getElementById("trip-tab-nav");
      const bottom = Math.max(0, tabNav?.getBoundingClientRect().bottom ?? 0) + 16;
      if (bottom !== lastBottom) {
        lastBottom = bottom;
        setStickyTop(bottom);
      }
      frame = requestAnimationFrame(syncStickyTop);
    }

    frame = requestAnimationFrame(syncStickyTop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const sections = trip.faqCategories
      .map((group) => document.getElementById(`faq-${slugify(group.category)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const category = visible[0]?.target.getAttribute("data-category");
        if (category) setActiveCategory(category);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [trip.faqCategories]);

  function toggleQuestion(question: string) {
    setOpenQuestions((prev) =>
      prev.includes(question)
        ? prev.filter((q) => q !== question)
        : [...prev, question],
    );
  }

  return (
    <section>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[284px_1fr]">
        <nav
          style={{ top: stickyTop }}
          // Hidden below `lg` — as a horizontal-scroll pill row it wasn't a
          // usable jump-nav on phones (9 categories, no way to scan them
          // without sideways scrolling), and the accordion cards below
          // already cover every question on their own without it.
          className="hidden rounded-2xl bg-primary-100 p-3 lg:sticky lg:flex lg:h-fit lg:flex-col lg:gap-1"
        >
          {trip.faqCategories.map((group) => {
            const isActive = activeCategory === group.category;
            return (
              <Link
                key={group.category}
                href={`#faq-${slugify(group.category)}`}
                className={`flex max-w-[240px] shrink-0 items-center rounded-xl px-6 py-3 font-poppins text-body-m font-medium lg:w-full lg:max-w-none ${
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-brand-neutral-700"
                }`}
              >
                {group.category}
              </Link>
            );
          })}
        </nav>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">
              FAQs For {trip.title}
            </h2>
            <button
              type="button"
              onClick={() =>
                setOpenQuestions((prev) =>
                  prev.length === allQuestions.length ? [] : allQuestions,
                )
              }
              className="font-poppins text-body-l font-medium text-brand-neutral-900"
            >
              Expand all
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {trip.faqCategories.map((group) => (
              <div
                key={group.category}
                id={`faq-${slugify(group.category)}`}
                data-category={group.category}
                // Orange `#fbc99d` border + white fill to match every other
                // card on this page (HighlightsAndOverview, ItinerarySection,
                // CostSection, MapSection, PackingAndKnowBefore, ...) —
                // this was the one section still on plain neutral-gray.
                // `bg-white` matters here specifically: without it the card
                // falls through to the page's own `#FFFAF0` background,
                // which is nearly indistinguishable from the `#fef7f0`
                // question cards inside it, so the whole section read as
                // one flat cream blob with no card boundary visible.
                className="rounded-2xl border border-[#fbc99d] bg-white p-5 shadow-card-strong scroll-mt-36"
              >
                <h3 className="border-b border-brand-neutral-200 pb-3 font-poppins text-2xl font-medium text-brand-neutral-900">
                  {group.category}
                </h3>
                <div className="mt-3 flex flex-col gap-3">
                  {group.questions.map((item) => {
                    const isOpen = openQuestions.includes(item.question);
                    return (
                      <div
                        key={item.question}
                        className="rounded-xl border border-[#fbdec1] bg-[#fef7f0]/60 p-4"
                      >
                        <button
                          type="button"
                          onClick={() => toggleQuestion(item.question)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 text-left"
                        >
                          <span className="font-raleway text-body-l font-semibold text-brand-neutral-900">
                            {item.question}
                          </span>
                          <ChevronDownIcon
                            className={`size-5 shrink-0 text-brand-neutral-700 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen ? (
                          <p className="mt-2 font-poppins text-body-l font-medium text-brand-neutral-700">
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
        </div>
      </div>
    </section>
  );
}
