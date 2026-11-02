import type { Metadata } from "next";
import {
  PartnerFormSection,
  PartnerHero,
  PartnerModels,
  PartnerOffers,
  PartnerProcess,
} from "@/components/sections/PartnerSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Become a Partner",
  description:
    "Partner with Joyful Trekking Pvt. Ltd. as a brand, creator or agency. Co-brand a trek, shoot content on the trail or earn commission on every booking — we reply within 48 hours.",
  path: "/become-a-partner",
});

export default function BecomeAPartnerPage() {
  return (
    <>
      <PartnerHero />
      <PartnerModels />
      <PartnerOffers />
      <PartnerProcess />
      <PartnerFormSection />
    </>
  );
}
