import { Mountain } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";

const COLLAGE = [
  { src: "/images/hero/hero-2.jpeg", alt: "Trekkers walking below Himalayan peaks and blooming rhododendrons", className: "col-span-2 aspect-[16/10]" },
  { src: "/images/journey/climb.jpg", alt: "A climber on a snow slope under a deep blue sky", className: "aspect-[4/5]" },
  { src: "/images/gallery/everest-5.jpg", alt: "The golden spire of Swayambhunath stupa with prayer flags", className: "aspect-[4/5]" },
];

const STATS = [
  { value: "1992", label: "Guiding the Himalayas begins" },
  { value: "2010", label: "Joyful Trekking founded" },
  { value: "3", label: "Countries: Nepal, Tibet, Bhutan" },
];

const STRIP = [
  { src: "/images/gallery/everest-1.jpg", alt: "A trekker on a mountain path with snowy peaks behind" },
  { src: "/images/gallery/everest-2.jpg", alt: "A trekker looking over a deep blue mountain lake" },
  { src: "/images/gallery/everest-3.jpg", alt: "A group of trekkers walking toward the mountains" },
  { src: "/images/journey/trek.jpg", alt: "Himalayan peaks above a rocky stream with prayer flags" },
  { src: "/images/trips/featured-annapurna-trek.jpg", alt: "Annapurna peaks rising above the trail" },
];

/**
 * "About Us" intro: story text beside a photo collage, a stats band in the
 * logo colours, and a photo strip. The copy is the same real company copy
 * the page has always carried; only the layout and the photos are new.
 */
export function AboutUsIntroSection() {
  return (
    <section className="bg-brand-neutral-000">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-6 py-16 min-[1000px]:grid-cols-2 min-[1000px]:gap-14 min-[1000px]:py-20 md:px-10">
        <div data-reveal="left">
          <p className="inline-flex items-center gap-2 rounded-pill border border-logo-sun/50 bg-logo-sun/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-logo-navy uppercase">
            <Mountain aria-hidden="true" className="size-3.5" />
            Who we are
          </p>
          <h2 className="mt-5 font-playfair-display text-[clamp(34px,5vw,52px)] leading-[1.1] font-bold text-logo-navy-dark">
            Trekking the Himalayas, <span className="text-logo-sun italic">joyfully.</span>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.85] text-brand-neutral-800">
            Joyful Trekking Pvt. Ltd. is a leading outbound and inbound tour and trekking company based in Kathmandu. We organize
            outbound tours to Tibet and Bhutan, alongside trekking and expedition trips through the Mount Everest region, Sagarmatha
            National Park, the Annapurna and Langtang regions, and Nepal&apos;s restricted areas.
          </p>
          <p className="mt-4 text-[17px] leading-[1.85] text-brand-neutral-800">
            We also arrange cultural tours, paragliding, and pilgrimage trips to explore Nepal&apos;s ancient heritage, always with an
            eye on ecological and environmental preservation. Sustainable, responsible tourism is the objective behind every Nepal,
            Tibet, and Bhutan package we run.
          </p>
        </div>

        <div data-reveal="right" className="grid grid-cols-2 gap-4">
          {COLLAGE.map((photo) => (
            <div key={photo.src} className={`relative overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(6,74,112,0.18)] ${photo.className}`}>
              <FillImage src={photo.src} alt={photo.alt} className="absolute inset-0 size-full object-cover" sizes="(min-width:1000px) 560px, 100vw" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-logo-navy-dark">
        <dl className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-10 text-center text-white sm:grid-cols-3 md:px-10">
          {STATS.map((stat) => (
            <div key={stat.label} data-reveal="up">
              <dt className="font-playfair-display text-[48px] leading-none font-bold text-logo-sun">{stat.value}</dt>
              <dd className="mt-2 text-[15px] text-white/85">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex gap-3 overflow-x-auto px-3 py-3 sm:px-0 sm:py-0">
        {STRIP.map((photo) => (
          <div key={photo.src} data-reveal="zoom" className="relative aspect-[3/4] min-w-[44%] flex-1 overflow-hidden sm:min-w-0 sm:rounded-none">
            <FillImage src={photo.src} alt={photo.alt} className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 20vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
