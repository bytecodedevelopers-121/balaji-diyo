import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Builds the href for a given page number, e.g. `(page) => `/blog?page=${page}`` . */
  buildHref: (page: number) => string;
}

type PageItem = number | "ellipsis";

/**
 * Bordered "card" pagination — Prev/Next chevron buttons + numbered
 * pages, collapsing a long run into a single "…" (e.g. `1 2 3 … 11`)
 * rather than listing every page. Link-based, no client state, works
 * from Server Components — same shape as before, only the visual
 * treatment and the ellipsis collapsing are new.
 */
function getPageList(currentPage: number, totalPages: number): PageItem[] {
  const delta = 1;
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    }
  }

  const withEllipsis: PageItem[] = [];
  let previous: number | undefined;
  for (const page of pages) {
    if (previous !== undefined) {
      if (page - previous === 2) {
        withEllipsis.push(previous + 1);
      } else if (page - previous > 2) {
        withEllipsis.push("ellipsis");
      }
    }
    withEllipsis.push(page);
    previous = page;
  }

  return withEllipsis;
}

const itemClassName =
  "flex h-9 min-w-9 items-center justify-center rounded-lg border border-brand-neutral-300 px-3 font-poppins text-body-m font-medium text-brand-neutral-800";

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageList(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className={cn(itemClassName, "gap-1.5 hover:bg-brand-neutral-100")}
        >
          <ChevronLeftIcon className="size-4" />
          Prev
        </Link>
      ) : (
        <span className={cn(itemClassName, "gap-1.5 cursor-not-allowed border-brand-neutral-200 text-brand-neutral-400")}>
          <ChevronLeftIcon className="size-4" />
          Prev
        </span>
      )}

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className={cn(itemClassName, "border-dashed text-brand-neutral-500")}
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              itemClassName,
              page === currentPage
                ? "border-secondary-500 bg-secondary-500 text-brand-neutral-000"
                : "hover:bg-brand-neutral-100",
            )}
          >
            {page}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className={cn(itemClassName, "gap-1.5 hover:bg-brand-neutral-100")}
        >
          Next
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span className={cn(itemClassName, "gap-1.5 cursor-not-allowed border-brand-neutral-200 text-brand-neutral-400")}>
          Next
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </nav>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
