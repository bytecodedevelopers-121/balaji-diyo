import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** "light" (default) is white text for the photo-hero use case
   *  (PageHero and every page that currently uses this component).
   *  "dark" is for a plain white/light background — e.g. a content page
   *  with no full-bleed photo behind it, like a team member detail
   *  page. */
  tone?: "light" | "dark";
}

/** Shared breadcrumb navigation for page heroes and other section headers. */
export function Breadcrumbs({
  items,
  className,
  tone = "light",
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "font-poppins text-body-s font-medium not-italic",
        tone === "dark" ? "text-brand-neutral-700" : "text-brand-neutral-000",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center justify-center gap-2">
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {index > 0 ? <span aria-hidden="true">&gt;</span> : null}
              {item.href && !isCurrentPage ? (
                <Link
                  href={item.href}
                  className="underline decoration-solid underline-offset-0 hover:opacity-80"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="underline decoration-solid underline-offset-0"
                  aria-current={isCurrentPage ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
