import { getHomepageServices } from "@/features/services/api/get-services";
import type {
  HomepageService,
  HomepageServicesPayload,
} from "@/features/services/types/service.types";
import { ServicesCarousel } from "./ServicesCarousel";

const FALLBACK_SERVICES: HomepageService[] = [
  {
    id: "fallback-adventure-tourism",
    title: "Adventure Tourism",
    description:
      "Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.",
    secondaryDescription:
      "Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.",
    imageUrl: "/images/services/adventure-tourism.jpg",
    ctaLabel: "Know More",
    ctaUrl: "/company/about-us",
    sortOrder: 1,
  },
];

const FALLBACK_PAYLOAD: HomepageServicesPayload = {
  section: {
    id: "homepage-services",
    eyebrow: "Services",
    heading: "Everything We Take Care of",
    introduction:
      "From the first email to the final descent, every part of your journey is planned, permitted, and personally guided.",
  },
  items: FALLBACK_SERVICES,
};

/**
 * Server-fetched CMS section with a narrow interactive client island for
 * changing cards. The fallback preserves homepage content during API outages
 * and before a new environment has run the services migration/seed.
 */
export async function ServicesSection() {
  let payload: HomepageServicesPayload;

  try {
    payload = await getHomepageServices();
  } catch {
    payload = FALLBACK_PAYLOAD;
  }

  if (payload.items.length === 0) return null;

  // `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's own
  // comment (2026-09-03, two passes).
  return (
    <section className="py-[2px] sm:py-[25px]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-16">
        <ServicesCarousel section={payload.section} services={payload.items} />
      </div>
    </section>
  );
}
