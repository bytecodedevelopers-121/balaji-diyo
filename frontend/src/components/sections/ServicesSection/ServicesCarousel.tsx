import type { HomepageService, HomepageServiceSection } from "@/features/services/types/service.types";
import { FillImage } from "@/components/ui/FillImage";

interface ServicesCarouselProps {
  section: HomepageServiceSection;
  services: HomepageService[];
}

/**
 * Homepage "Services" section — direct request (2026-09-07): only ever
 * show a single service here, no switching between several and no
 * "Know More" CTA. Previously a real carousel (numbered pager +
 * `services[selectedIndex]`, name kept from that era even though it no
 * longer switches anything) — now always renders `services[0]` (already
 * `sortOrder`-sorted server-side) and ignores the rest of the CMS list
 * outright, so an admin adding more services later still can't put more
 * than one on the homepage.
 */
export function ServicesCarousel({ section, services }: ServicesCarouselProps) {
  const service = services[0];
  if (!service) return null;

  return (
    <>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-body-l font-medium text-primary-500">{section.eyebrow}</p>
          <h2 className="mt-2 max-w-xl whitespace-nowrap font-display text-[clamp(20px,6.8vw,32px)] leading-[1.6] font-medium text-brand-neutral-1000 sm:text-display-section">
            {section.heading}
          </h2>
        </div>
        <div className="flex w-full max-w-[430px] flex-col gap-4 text-left">
          <p className="text-body-l text-brand-neutral-800">
            {section.introduction}
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card">
          <FillImage src={service.imageUrl} alt={service.title} className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 33vw, 85vw" />
        </div>

        <div>
          <h3 className="text-heading-2xl font-bold text-brand-neutral-1000">{service.title}</h3>
          <p className="mt-4 text-body-l text-brand-neutral-800">{service.description}</p>
          {service.secondaryDescription ? (
            <p className="mt-4 text-body-l text-brand-neutral-800">{service.secondaryDescription}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
