"use client";

import { tripHref } from "@/lib/trip-href";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { searchTrips } from "@/features/trips/api/search-trips";
import type { Trip } from "@/features/trips/types/trip.types";
import { searchBlogs, type BlogSearchResult } from "@/features/blogs/api/search-blogs";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";
import { cn } from "@/lib/utils";
import { FillImage } from "@/components/ui/FillImage";

gsap.registerPlugin(useGSAP);

/** Debounce delay before a query actually fires a request — long enough
 *  to skip a request per keystroke, short enough to still feel live. */
const DEBOUNCE_MS = 300;

interface HeaderSearchResultsProps {
  isOpen: boolean;
  query: string;
  onClose: () => void;
  panelId: string;
  panelTopClassName: string;
  /**
   * "bar" (default, the header's own search): full-width bar under the
   * header. "dropdown": a compact card the width of its search pill, placed
   * from the `--hero-search-*` CSS vars the hero search sets.
   */
  variant?: "bar" | "dropdown";
}

/**
 * Header search's results dropdown — Figma "Frame 1000006690" (node
 * 475:11314, "Homepage - Search - Active"): a full-width white panel
 * directly under the header, listing matching trips (thumbnail, title,
 * duration, "From $price") sourced live from `GET /packages?search=`
 * (`searchTrips`, debounced by `DEBOUNCE_MS`).
 *
 * Mirrors `DestinationDropdown.tsx`'s own shape: portaled to
 * `document.body` (same reason — the trigger's `.nav_link` GSAP
 * transform would otherwise redefine this panel's `fixed` containing
 * block), a `mounted`/`isOpen` split so the close animation actually
 * plays before unmounting, and Escape/outside-click closing. Unlike that
 * component, "outside" here has to include *both* mobile and desktop
 * copies of the search pill (`HeaderSearchInput` — one mounts per
 * breakpoint, only one visible at a time) rather than a single trigger
 * ref, so the check below matches on the shared
 * `data-header-search-region` attribute instead of a ref.
 *
 * Shows nothing while the query is empty (matches the Figma default
 * state: pill with placeholder text, no panel) — only once a query has
 * actually been typed does this render its loading/empty/results state,
 * matching the "Active" state's typed "Everest" + results list.
 */
export function HeaderSearchResults({
  isOpen,
  query,
  onClose,
  panelId,
  panelTopClassName,
  variant = "bar",
}: HeaderSearchResultsProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const trimmedQuery = query.trim();
  const shouldShow = isOpen && trimmedQuery.length > 0;
  const [mounted, setMounted] = useState(shouldShow);

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [results, setResults] = useState<Trip[]>([]);
  const [blogResults, setBlogResults] = useState<BlogSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wasShown, setWasShown] = useState(shouldShow);
  if (shouldShow !== wasShown) {
    setWasShown(shouldShow);
    if (shouldShow) {
      setMounted(true);
    } else {
      // Render-phase reset (React's documented pattern for adjusting
      // state when a value changes — same precedent as
      // DestinationDropdown.tsx's own close-reset), not a `useEffect`
      // branch: avoids a synchronous `setState`-in-effect cascade for
      // what's really just "the query closed, so drop its results".
      setStatus("idle");
      setResults([]);
      setBlogResults([]);
    }
  }

  useEffect(() => {
    if (!shouldShow) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setStatus("loading");
      try {
        // Trips are required; a blog-search failure just hides that group.
        const [trips, blogs] = await Promise.all([
          searchTrips(trimmedQuery, { signal: controller.signal }),
          searchBlogs(trimmedQuery, { signal: controller.signal }).catch(() => []),
        ]);
        setResults(trips);
        setBlogResults(blogs);
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [shouldShow, trimmedQuery]);

  useGSAP(
    () => {
      if (!panelRef.current) return;
      const panel = panelRef.current;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (shouldShow) {
        if (prefersReducedMotion) {
          gsap.set(panel, { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: -12 },
          { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" },
        );
      } else if (mounted) {
        if (prefersReducedMotion) {
          setMounted(false);
          return;
        }
        gsap.to(panel, {
          autoAlpha: 0,
          y: -12,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => setMounted(false),
        });
      }
    },
    { dependencies: [shouldShow], scope: panelRef },
  );

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (target.closest("[data-header-search-region]")) return;
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  if (variant === "dropdown") {
    const hasResults = results.length > 0 || blogResults.length > 0;
    return createPortal(
      <div
        id={panelId}
        ref={panelRef}
        data-header-search-region
        role="region"
        aria-label="Search results"
        className="destination-scroll fixed z-40 max-h-[min(400px,calc(100dvh-220px))] overflow-y-auto rounded-[10px] bg-brand-neutral-000 py-2 shadow-[0_12px_40px_rgba(6,74,112,0.3)]"
        style={{
          top: "var(--hero-search-bottom, 300px)",
          left: "var(--hero-search-left, 0px)",
          width: "var(--hero-search-width, 100%)",
        }}
      >
        {status === "loading" ? (
          <p className="px-5 py-4 font-poppins text-body-m text-brand-neutral-800">Searching…</p>
        ) : status === "error" ? (
          <p className="px-5 py-4 font-poppins text-body-m text-error-700">{errorMessage}</p>
        ) : !hasResults ? (
          <p className="px-5 py-4 font-poppins text-body-m text-brand-neutral-800">
            No trips or articles found for &ldquo;{trimmedQuery}&rdquo;.
          </p>
        ) : (
          <>
            {results.length > 0 ? (
              <ul aria-label="Trips and packages" className="flex flex-col">
                {results.map((trip) => (
                  <li key={trip.id}>
                    <Link
                      href={tripHref(trip.slug)}
                      onClick={onClose}
                      className="flex items-center gap-4 px-3 py-2.5 transition-colors hover:bg-brand-neutral-100 focus-visible:bg-brand-neutral-100 focus-visible:outline-none"
                    >
                      <span className="relative h-[54px] w-[82px] shrink-0 overflow-hidden rounded-[4px] bg-brand-neutral-200">
                        {trip.imageUrl ? (
                          <FillImage src={trip.imageUrl} alt="" aria-hidden="true" className="object-cover" sizes="82px" />
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[17px] font-semibold text-logo-navy">{trip.title}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-5 text-[14px] font-semibold text-brand-neutral-900">
                          <span>Price: {trip.priceFrom !== undefined ? `US$${trip.priceFrom}` : "Contact us"}</span>
                          {trip.duration && trip.durationType ? (
                            <span>
                              Duration: {trip.duration} {trip.durationType}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {blogResults.length > 0 ? (
              <div>
                <p className="px-5 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-brand-neutral-700 uppercase">
                  Blog Articles
                </p>
                <ul aria-label="Blog articles" className="flex flex-col">
                  {blogResults.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-3 py-2.5 transition-colors hover:bg-brand-neutral-100 focus-visible:bg-brand-neutral-100 focus-visible:outline-none"
                      >
                        <span className="relative h-[54px] w-[82px] shrink-0 overflow-hidden rounded-[4px] bg-brand-neutral-200">
                          {post.imageUrl ? (
                            <FillImage src={post.imageUrl} alt="" aria-hidden="true" className="object-cover" sizes="82px" />
                          ) : null}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[17px] font-semibold text-logo-navy">{post.title}</span>
                          <span className="mt-0.5 text-[14px] text-brand-neutral-800">{formatBlogDate(post.blogDate)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      id={panelId}
      ref={panelRef}
      data-header-search-region
      role="region"
      aria-label="Search results"
      className={cn(
        "fixed inset-x-0 z-40 max-h-[576px] w-full overflow-y-auto border-b border-brand-neutral-300 bg-brand-neutral-000 px-8 py-6 shadow-card-strong sm:px-16",
        panelTopClassName,
      )}
    >
      {status === "loading" ? (
        <p className="font-poppins text-body-m text-brand-neutral-800">Searching…</p>
      ) : status === "error" ? (
        <p className="font-poppins text-body-m text-error-700">{errorMessage}</p>
      ) : results.length === 0 && blogResults.length === 0 ? (
        <p className="font-poppins text-body-m text-brand-neutral-800">
          No trips or articles found for &ldquo;{trimmedQuery}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {results.length > 0 ? (
            <section aria-label="Trips and packages">
              <h3 className="mb-1 font-poppins text-body-m font-semibold tracking-wide text-logo-navy uppercase">
                Trips &amp; Packages
              </h3>
        <ul className="flex flex-col">
            {results.map((trip, index) => (
              <li
                key={trip.id}
                className={cn(
                  "border-brand-neutral-300 py-3",
                  index < results.length - 1 && "border-b",
                )}
              >
                <Link
                  href={tripHref(trip.slug)}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-900"
                >
                  <span className="relative size-[70px] shrink-0 overflow-hidden rounded-[12px] bg-brand-neutral-200 sm:h-[110px] sm:w-[140px]">
                    {trip.imageUrl ? (
                      <FillImage
                        src={trip.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 size-full object-cover" sizes="96px" />
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-poppins text-heading-xl font-medium text-primary-800">
                      {trip.title}
                    </span>
                    {trip.duration && trip.durationType ? (
                      <span className="font-poppins text-body-m font-medium text-brand-neutral-600">
                        {trip.duration} {trip.durationType}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span className="font-poppins text-body-m font-medium text-brand-neutral-600">From</span>
                    <span className="font-poppins text-heading-xl font-medium text-primary-800">
                      {trip.priceFrom !== undefined ? `$${trip.priceFrom}` : "Contact us"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
            </section>
          ) : null}

          {blogResults.length > 0 ? (
            <section aria-label="Blog articles">
              <h3 className="mb-1 font-poppins text-body-m font-semibold tracking-wide text-logo-navy uppercase">
                Blog Articles
              </h3>
              <ul className="flex flex-col">
                {blogResults.map((post, index) => (
                  <li
                    key={post.id}
                    className={cn("border-brand-neutral-300 py-3", index < blogResults.length - 1 && "border-b")}
                  >
                    <Link
                      href={`/blog/${post.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-900"
                    >
                      <span className="relative size-[56px] shrink-0 overflow-hidden rounded-[10px] bg-brand-neutral-200 sm:h-[70px] sm:w-[100px]">
                        {post.imageUrl ? (
                          <FillImage
                            src={post.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 size-full object-cover"
                            sizes="100px"
                          />
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-poppins text-body-l font-medium text-primary-800">
                          {post.title}
                        </span>
                        <span className="font-poppins text-body-m text-brand-neutral-600">
                          {formatBlogDate(post.blogDate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>,
    document.body,
  );
}
