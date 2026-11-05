import type { TocEntry } from "../lib/toc";

/** Sticky "Table of Contents" card: numbered sections with their sub-sections nested below. */
export function BlogTableOfContents({ toc }: { toc: TocEntry[] }) {
  if (toc.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-[4px] border-t-4 border-r-4 border-primary-500 bg-[#fdf1e8] p-6 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
    >
      <h2 className="text-[20px] font-medium text-brand-neutral-1000">Table of Contents</h2>
      <ol className="mt-4 flex flex-col gap-3 text-[13px] leading-snug text-brand-neutral-1000">
        {toc.map((entry, index) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`} className="font-medium hover:text-primary-500">
              {index + 1}. {entry.text}
            </a>
            {entry.children.length > 0 ? (
              <ol className="mt-2 ml-4 flex flex-col gap-2">
                {entry.children.map((child, childIndex) => (
                  <li key={child.id}>
                    <a href={`#${child.id}`} className="hover:text-primary-500">
                      {childIndex + 1}. {child.text}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
