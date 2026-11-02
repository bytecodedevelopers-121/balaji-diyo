import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";

interface PageHeroProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
}

/**
 * Secondary-page hero — breadcrumb row + H1 + subtitle over a full-bleed
 * photo, in normal document flow (unlike the homepage hero, which sits
 * behind an absolutely-positioned transparent header). Shared by every
 * page using the `(pages)` route group layout (light Header variant);
 * see design-references/"Why Boundless Adventure.png" (y≈0–600) and
 * "about-us.png" (y≈0–600) — same shape, different copy/photo, on both.
 *
 * Server Component — no interaction here, same as HeroSection.
 */
export function PageHero({
  breadcrumbs,
  title,
  subtitle,
  image,
  imageAlt,
}: PageHeroProps) {
  return (
    <section className="relative isolate flex min-h-[420px] w-full items-center overflow-hidden px-6 py-16 sm:min-h-[560px] md:px-16">
      <FillImage
        src={image}
        alt={imageAlt}
        className="absolute inset-0 -z-10 block size-full object-cover object-center" sizes="100vw" preload />
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center text-center">
        <Breadcrumbs items={breadcrumbs} />

        <h1 className="mt-4 max-w-5xl text-center font-playfair-display text-[48px] leading-[1.2] font-medium tracking-[0] text-brand-neutral-000 not-italic sm:text-[84px] sm:leading-[115.2px]">
          {title}
        </h1>
        <p className="mt-4 max-w-4xl text-center font-poppins text-[18px] leading-[28.8px] font-medium tracking-[0] text-brand-neutral-000 not-italic">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
