import { FillImage } from "@/components/ui/FillImage";
/**
 * "Why Boundless Adventure" — the /why-boundless-adventure page's intro
 * content, transcribed from design-references/
 * "Why Boundless Adventure.png" (y≈600–1500 at 1440px). Centered
 * heading + two paragraphs, then a full-width photo (Patan Durbar
 * Square at dusk — public/images/why-boundless/temple.jpg, a real
 * export, not a screenshot crop).
 *
 * The second paragraph ("Boundless Adventure Nepal: A child was
 * growing up...") is byte-identical to AboutSection's first paragraph
 * on the homepage — kept verbatim, not deduped, same fidelity rule as
 * every other repeated block transcribed this session.
 *
 * The floating WhatsApp button this section used to mount itself is
 * now global (root layout, 2026-08-27) — every page gets it, not just
 * this one, so it's no longer rendered here.
 */

export function WhyBoundlessSection() {
  return (
    <section className="bg-brand-neutral-000 py-[2px] sm:py-[25px]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-6 px-6 text-center md:px-16">
        <h2 className="font-playfair-display text-[84px] leading-[1.15] font-medium text-brand-neutral-1000 sm:text-display-section">
          Why Joyful Trekking Pvt. Ltd.
        </h2>
        <p className="text-body-l text-brand-neutral-800">
          As pioneers in Nepali tourism, we have felt the pulse and rhythm
          of the country with every virgin trail we&apos;ve walked, every
          nook and cranny we&apos;ve traversed, and every new face that
          has smiled at us. We know every bump on the road, every
          bloodstain in our history and the slightest gesture in our
          culture. Believe us when we say that we single-handedly bring
          more to the table than the entire travel industry set up in
          Thamel.
        </p>
        <p className="text-body-l text-brand-neutral-800">
          Joyful Trekking Pvt. Ltd.: A child was growing up, observing
          and enjoying the geographical variation and the beauty it
          produced. Since childhood, he has enjoyed the chirps of birds,
          the howling of jackals, the gurgling of rivers, and the
          Himalayas playing hide-and-seek with clouds, and trees staying
          bare, sometimes, then again, bearing new leaves and fruits of
          their kind. Besides, he observed and participated in cultural
          programs celebrated in his multi-ethnic communities. His
          upbringing taught him to love nature and respect culture.
        </p>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1440px] px-6 md:px-16">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card sm:aspect-[2.4/1]">
          <FillImage
            src="/images/why-boundless/temple.jpg"
            alt="Patan Durbar Square temples lit at dusk"
            className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
        </div>
      </div>
    </section>
  );
}
