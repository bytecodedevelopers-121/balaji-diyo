"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderSearchInputProps {
  inputId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  className?: string;
}

/**
 * The header search pill itself — Figma "Frame 1000006704" (node
 * 475:11314, "Homepage - Search" / "Homepage - Search - Active"): a
 * 50px-tall, fully-rounded field with a search icon, the query text (or
 * its "Search any trips..." placeholder), and a trailing close ("x")
 * button that collapses the whole search UI back to a plain icon.
 *
 * Purely presentational/controlled — HeaderSearch.tsx owns `query` and
 * whether the search UI is open at all; this only renders the input
 * itself, so it can be mounted once per breakpoint (mobile row, desktop
 * nav) without duplicating fetch/state logic.
 */
export function HeaderSearchInput({
  inputId,
  query,
  onQueryChange,
  onClose,
  className,
}: HeaderSearchInputProps) {
  return (
    <div
      data-header-search-region
      className={cn(
        "flex h-[50px] min-w-0 items-center gap-3 rounded-pill border border-brand-neutral-400 bg-brand-neutral-000 px-5",
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className="size-5 shrink-0 text-brand-neutral-800"
        strokeWidth={2}
      />
      <label className="sr-only" htmlFor={inputId}>
        Search trips
      </label>
      <input
        id={inputId}
        // Plain "text", not "search": the browser's own native
        // search-cancel button would otherwise double up with the
        // dedicated close ("x") button below it — Figma's pill has
        // exactly one.
        type="text"
        autoFocus
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search any trips..."
        className="min-w-0 flex-1 bg-transparent font-poppins text-body-m font-medium text-brand-neutral-1000 placeholder:text-brand-neutral-600 focus:outline-none"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="flex shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-900"
      >
        <X aria-hidden="true" className="size-5 text-brand-neutral-800" strokeWidth={2} />
      </button>
    </div>
  );
}
