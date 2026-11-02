import { FillImage } from "@/components/ui/FillImage";
const PHOTOS = [
  { src: "/images/about-us/trail-1-overlook.jpg", alt: "A trekker overlooking a glacial lake from a cliff" },
  { src: "/images/about-us/trail-5-ridge.jpg", alt: "Two trekkers with poles on a rocky ridge trail" },
  { src: "/images/about-us/trail-3-group.jpg", alt: "A group of trekkers walking a mountain ridge" },
  { src: "/images/about-us/trail-4-bridge.jpg", alt: "Trekkers crossing a suspension bridge" },
  { src: "/images/about-us/trail-2-path.jpg", alt: "Trekkers with a dog on a green mountain trail" },
];

/**
 * "About Us" intro, transcribed from Figma. Previously rendered the
 * `about-us` CMS page's `introHtml` directly — but that flat legacy
 * article (an "Executive summary" written for the old site's SEO
 * copy, 5 paragraphs, external links, an inline figure) never matched
 * this design's compact 2-paragraph shape, which is what prompted
 * this rewrite (2026-08-27): decoupled from the CMS entirely, same
 * "hardcoded static copy" pattern the homepage's `AboutSection`/
 * `FeaturesSection` already use rather than trying to force-fit
 * mismatched legacy HTML into a design it was never written for.
 *
 * The copy below is still real — lightly tightened from that same
 * real CMS "Executive summary" section (not invented), just trimmed
 * to two paragraphs and stripped of the external links/figure that
 * don't fit this layout. The rest of that legacy article no longer
 * renders anywhere on this page — an earlier pass added a block for
 * it further down, removed same day per explicit "don't display the
 * old content, match the Figma design" direction.
 */
export function AboutUsIntroSection() {
  return (
    <section className="bg-brand-neutral-000 py-[2px] sm:py-[25px]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-5 px-6 text-center md:px-0">
        <h2 className="font-playfair-display text-[54px] leading-[1.15] font-medium text-brand-neutral-1000 sm:text-display-section">
          About Us
        </h2>
        <p className="text-body-l text-brand-neutral-800">
          Joyful Trekking Pvt. Ltd. is a leading outbound and inbound tour
          and trekking company based in Kathmandu. We organize outbound
          tours to Tibet and Bhutan, alongside trekking and expedition
          trips through the Mount Everest region, Sagarmatha National
          Park, the Annapurna and Langtang regions, and Nepal&apos;s
          restricted areas.
        </p>
        <p className="text-body-l text-brand-neutral-800">
          We also arrange cultural tours, paragliding, and pilgrimage
          trips to explore Nepal&apos;s ancient heritage, always with an
          eye on ecological and environmental preservation. Sustainable,
          responsible tourism is the objective behind every Nepal, Tibet,
          and Bhutan package we run.
        </p>
      </div>

      <div className="mt-12 flex gap-3 overflow-x-auto">
        {PHOTOS.map((photo) => (
          <div key={photo.src} className="relative aspect-[3/4] min-w-0 flex-1 overflow-hidden rounded-[12px]">
            <FillImage src={photo.src} alt={photo.alt} className="absolute inset-0 size-full border-medium object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
