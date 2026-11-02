import type { Metadata } from "next";
import { PlanWithUsSection } from "@/components/sections/PlanWithUsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Plan With Us",
  description:
    "Tell us your preferred destination, experience, group size, and budget, and we'll shape a personalized itinerary around it.",
  path: "/plan-with-us",
});

/**
 * Transcribed from design-references/"Plan with us - Preferences.png",
 * "Plan With Us Details.png", and "Plan with us - Review.png" — a
 * single 3-step wizard, one screenshot per step (see PlanWithUsWizard
 * for the actual step components).
 *
 * "/plan-with-us" is the real intended route: navigation.ts's
 * `headerCta` originally pointed here (its own comment: "the
 * 'Plan with us — Preferences/Details/Review' flow seen elsewhere in
 * the Figma file (not audited/built yet)") before being redirected at
 * `/customize-trip` as a stand-in while this page didn't exist yet.
 * Both pages coexist in the real design — the footer's own "Customize
 * Trip" link (a separate, simpler, package-based enquiry form) is
 * listed independently from the header's "Plan with us" button on
 * every one of this page's own screenshots — so this doesn't replace
 * customize-trip, and `headerCta` now points back here.
 */
export default function PlanWithUsPage() {
  return (
    <>
      <PlanWithUsSection />
      <CtaSection />
    </>
  );
}
