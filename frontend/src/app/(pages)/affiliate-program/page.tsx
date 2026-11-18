import type { Metadata } from "next";
import { AffiliateForm } from "@/components/sections/AffiliateSection/AffiliateForm";
import { CmsProse } from "@/components/ui/CmsProse";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { AFFILIATE_DEFAULTS } from "@/features/page-content/affiliate-defaults";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("affiliate"), "seo", AFFILIATE_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/affiliate-program" });
}

/** Affiliate Program: breadcrumb, title, how the program works, who can join, and the "Become an affiliate" form. */
export default async function AffiliateProgramPage() {
  // Every heading, paragraph, the form labels and the closing banner are editable in the admin (Page Content → Affiliate Program).
  const sections = await getPageSections("affiliate");
  const intro = resolveSection(sections, "intro", AFFILIATE_DEFAULTS.intro);
  const form = resolveSection(sections, "form", AFFILIATE_DEFAULTS.form);

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[900px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: intro.content.title }]}
          />

          <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
            {intro.content.title}
          </h1>

          <CmsProse
            html={intro.content.body}
            className="mt-6 !text-[14px] !leading-[1.85] [&_h2]:!font-poppins [&_h2]:!mt-6 [&_h2]:!text-[20px] [&_h2]:!font-semibold"
          />

          <AffiliateForm content={form.content} />
        </div>
      </section>
    </>
  );
}
