import type { Metadata } from "next";
import Link from "next/link";
import { CompanyProse } from "@/components/ui/CompanyProse";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { PLAN_DEFAULTS } from "@/features/page-content/plan-defaults";
import { buildMetadata } from "@/lib/seo/metadata";
import { PlanYourTripForm } from "./_components/PlanYourTripForm";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("plan"), "seo", PLAN_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/plan-your-trip" });
}

/** Plan Your Nepal Trip: intro copy plus a single-page enquiry form. */
export default async function PlanYourTripPage() {
  // Heading, intro text and form labels are editable in the admin (Page Content → Plan Your Trip).
  const sections = await getPageSections("plan");
  const { content } = resolveSection(sections, "content", PLAN_DEFAULTS.content);
  const form = resolveSection(sections, "form", PLAN_DEFAULTS.form).content;
  return (
    <main className="bg-white px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-brand-neutral-700">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          <span aria-hidden="true">→</span> <span className="text-brand-neutral-1000">{content.title}</span>
        </nav>
        <h1 className="mb-6 font-display text-[clamp(32px,5vw,52px)] leading-tight font-bold text-brand-neutral-1000">
          {content.title}
        </h1>

        <CompanyProse html={content.body} className="mt-0 mb-8 !leading-[1.9]" />

        <PlanYourTripForm content={form} />
      </div>
    </main>
  );
}
