import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /**
   * "dark" (default): dark title/description for a light section
   * background. "light": white title/description for a black section
   * background (e.g. Gallery, Services, Blog — see each section's own
   * comment for its background). The eyebrow is the same accent blue
   * either way — sampled at that constant color across every section
   * in design-references/homepage.png, light or dark background alike.
   */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * Standard eyebrow + Raleway heading (+ optional description) block,
 * reused across the centered section headings in design-references/
 * homepage.png (Popular Trips "Holidays", Gallery, Trips "2026/27
 * Lineup", About "Origins", Features). Sections whose heading isn't
 * this centered-stack shape (Journey's two-column layout, Testimonials'
 * left-aligned + platform-badge row, Blog's left-aligned + card grid)
 * compose their own heading markup instead of forcing it through here.
 *
 * The large title renders at partial opacity in the source
 * screenshot on every section that has one — a scroll-reveal
 * (fade/slide-up) animation caught mid-transition by whatever tool
 * captured that full-page screenshot, not the resting state. Rendered
 * here at full opacity, which is also the only reading that isn't a
 * contrast/accessibility bug on the sections with a light background.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-body-l font-medium text-primary-500">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "mt-2 font-display text-raleway-4xl font-medium sm:text-display-section",
          tone === "light" ? "text-brand-neutral-000" : "text-brand-neutral-1000",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-body-l",
            tone === "light" ? "text-brand-neutral-300" : "text-brand-neutral-800",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
