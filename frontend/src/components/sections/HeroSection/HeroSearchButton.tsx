"use client";

import { useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { HeaderSearchResults } from "@/components/layout/Header/HeaderSearchResults";

/**
 * "Find an Adventure" pill in the hero — a real input. Typing shows the
 * same live trip results as the header search, in a panel dropped right
 * below the pill (reusing `HeaderSearchResults`; its `top` comes from the
 * `--hero-search-bottom` CSS var set here from the pill's own position).
 */
export function HeroSearchButton() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const panelId = useId();
  const pillRef = useRef<HTMLDivElement>(null);

  function placePanel() {
    const rect = pillRef.current?.getBoundingClientRect();
    if (rect) {
      const root = document.documentElement.style;
      root.setProperty("--hero-search-bottom", `${rect.bottom + 8}px`);
      root.setProperty("--hero-search-left", `${rect.left}px`);
      root.setProperty("--hero-search-width", `${rect.width}px`);
    }
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <div
        ref={pillRef}
        data-header-search-region
        className="flex h-[60px] w-full items-center justify-between rounded-pill bg-brand-neutral-000 py-[6px] pr-[6px] pl-6 shadow-[0_0_0_4px_rgba(255,255,255,0.18)] focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-logo-sun md:h-[72px]"
      >
        <label htmlFor={inputId} className="sr-only">
          Search trips
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            placePanel();
            setOpen(true);
          }}
          onFocus={placePanel}
          placeholder="Find an Adventure"
          autoComplete="off"
          aria-controls={panelId}
          className="min-w-0 flex-1 bg-transparent text-body-l text-brand-neutral-1000 placeholder:text-brand-neutral-600 focus:outline-none md:text-heading-md"
        />
        {query ? (
          <button
            type="button"
            onClick={close}
            aria-label="Clear search"
            className="mr-2 rounded-sm p-1 text-brand-neutral-800 focus-visible:outline-2 focus-visible:outline-logo-navy"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            placePanel();
            setOpen(query.trim().length > 0);
          }}
          aria-label="Search"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-logo-sun text-logo-navy-dark md:size-[60px]"
        >
          <Search aria-hidden="true" className="size-5 md:size-6" strokeWidth={2.5} />
        </button>
      </div>
      <HeaderSearchResults
        isOpen={open}
        query={query}
        onClose={close}
        panelId={panelId}
        panelTopClassName="top-[var(--hero-search-bottom,300px)]"
        variant="dropdown"
      />
    </>
  );
}
