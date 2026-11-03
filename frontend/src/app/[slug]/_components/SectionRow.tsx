import type { ReactNode } from "react";

/** Star-on-bookmark bullets for lists inside CMS copy (overview, highlights, packing list). */
export const STAR_BULLETS =
  "[&_ul]:list-none [&_ul]:pl-0 [&_ul>li]:relative [&_ul>li]:pl-9 [&_ul>li]:before:absolute [&_ul>li]:before:top-0.5 [&_ul>li]:before:left-0 [&_ul>li]:before:size-6 [&_ul>li]:before:bg-[url('/icons/star-bookmark.svg')] [&_ul>li]:before:bg-contain [&_ul>li]:before:bg-no-repeat [&_ul>li]:before:content-['']";

/** Placeholder shown inside a section that has no content yet. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-[#c9d3e0] bg-[#f8fafc] p-6 text-[15px] text-brand-neutral-700">
      {children}
    </p>
  );
}

/**
 * Package-page section layout: a label column on the left (orange bar +
 * title + small icon) and the section's content on the right. Collapses to
 * a stacked label above content below `md`.
 */
export function SectionRow({
  id,
  label,
  icon,
  children,
}: {
  id?: string;
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid gap-4 py-6 md:grid-cols-[170px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="border-l-4 border-[#f7931e] pl-3 text-[22px] leading-tight font-medium text-brand-neutral-900">
          {label}
        </h2>
        {icon ? <div className="mt-4 hidden pl-3 text-brand-neutral-700 md:block">{icon}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
