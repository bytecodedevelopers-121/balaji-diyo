import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils";

export interface PanelSection {
  id: string;
  label: string;
}

interface SectionedLayoutProps {
  sections: PanelSection[];
  children: ReactNode;
}

/**
 * Two-column form panel: a sticky section list on the left, stacked content on
 * the right, with the active entry tracked by scroll position. Mirrors how the
 * legacy admin laid out each package tab.
 *
 * Content is matched to nav entries by `data-section-id` — wrap each block in
 * <SectionAnchor id="..."> using the same ids passed in `sections`.
 */
export function SectionedLayout({ sections, children }: SectionedLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const elements = sections
      .map((s) => root.querySelector<HTMLElement>(`[data-section-id="${s.id}"]`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // Top-biased band: whichever tracked section is highest in the upper
    // portion of the viewport wins, so the nav follows reading position
    // rather than flickering between whatever is merely on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute("data-section-id");
        if (id) setActive(id);
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const jumpTo = (id: string) => {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="Sections" className="hidden lg:block">
        <ul className="sticky top-4 space-y-0.5 border-l border-gray-200">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => jumpTo(section.id)}
                aria-current={active === section.id ? "true" : undefined}
                className={cn(
                  "-ml-px block w-full border-l-2 py-1.5 pl-3 text-left text-xs transition-colors",
                  active === section.id
                    ? "border-indigo-600 font-semibold text-indigo-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
                )}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}

/** Scroll target for one entry in a SectionedLayout's nav. */
export function SectionAnchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div data-section-id={id} className="scroll-mt-4">
      {children}
    </div>
  );
}
