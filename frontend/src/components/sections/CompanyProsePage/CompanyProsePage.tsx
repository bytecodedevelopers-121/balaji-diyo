import type { ReactNode } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CompanyProse } from "@/components/ui/CompanyProse";
import { FillImage } from "@/components/ui/FillImage";
import type { ProsePageContent } from "@/features/page-content/company-defaults";

interface Props {
  content: ProsePageContent["content"];
  /** Max width of the text column. */
  width?: 860 | 900;
  /** Rendered after the text (e.g. the partner enquiry form). */
  after?: ReactNode;
  /** Hide the closing banner on pages that end with their own form. */
  withCta?: boolean;
  /** Middle breadcrumb; pass null to leave it out (pages created in the admin aren't under Company). */
  crumb?: string | null;
}

/**
 * Shared layout of the text-only Company pages (Why Guided Travel, Responsible Travel, Partner with Us,
 * Terms, Privacy): optional wide photo, breadcrumb, heading and the rich-text body written in the admin.
 */
export function CompanyProsePage({ content, width = 900, after, withCta = true, crumb = "Company" }: Props) {
  const wide = Boolean(content.image);
  // Static class names (Tailwind can't see ones built from a variable).
  const column = width === 860 ? "max-w-[860px]" : "max-w-[900px]";
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className={wide ? "mx-auto w-full max-w-[1100px]" : `mx-auto w-full ${column}`}>
            {content.image ? (
              <div data-reveal="zoom" className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(6,74,112,0.2)]">
                <FillImage
                  src={content.image}
                  alt={content.imageAlt ?? ""}
                  className="absolute inset-0 size-full object-cover"
                  sizes="(min-width:1100px) 1100px, 100vw"
                  preload
                />
              </div>
            ) : null}

            <div className={wide ? `mx-auto mt-5 w-full ${column}` : undefined}>
              <Breadcrumbs
                tone="dark"
                className="[&_ol]:justify-start"
                items={[{ label: "Home", href: "/" }, ...(crumb ? [{ label: crumb }] : []), { label: content.title }]}
              />
              <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
                {content.title}
              </h1>
              <CompanyProse html={content.body} />
            </div>
          </div>
        </section>
      </Reveal>
      {after}
      {withCta ? <CtaSection /> : null}
    </>
  );
}
