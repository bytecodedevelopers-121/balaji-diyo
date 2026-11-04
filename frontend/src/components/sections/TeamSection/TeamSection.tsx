import { Users } from "lucide-react";
import { Reveal } from "@/components/animation/Reveal";
import { FillImage } from "@/components/ui/FillImage";
import { TeamGrid } from "./TeamGrid";

/**
 * "Our Team": an intro (label, heading, the company's own story in two
 * paragraphs, beside a mountain photo) followed by the team grid. The copy
 * is unchanged from the previous design; the layout, palette and animation
 * are new.
 */
export function TeamSection() {
  return (
    <section className="bg-[#f6f9fc]">
      <Reveal variant="auto">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-6 py-16 min-[1000px]:grid-cols-[1.15fr_1fr] min-[1000px]:gap-14 md:px-10 min-[1120px]:px-0">
          <div data-reveal="left">
            <p className="inline-flex items-center gap-2 rounded-pill border border-logo-sun/50 bg-logo-sun/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-logo-navy uppercase">
              <Users aria-hidden="true" className="size-3.5" />
              The people behind the trails
            </p>
            <h2 className="mt-5 font-playfair-display text-[clamp(34px,5vw,50px)] leading-[1.1] font-bold text-logo-navy-dark">
              Our <span className="text-logo-sun italic">Team</span>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.85] text-brand-neutral-800">
              As pioneers in Nepali tourism, we have felt the pulse and rhythm of the country with every virgin trail we&apos;ve walked,
              every nook and cranny we&apos;ve traversed, and every new face that has smiled at us. We know every bump on the road, every
              bloodstain in our history and the slightest gesture in our culture. Believe us when we say that we single-handedly bring more
              to the table than the entire travel industry set up in Thamel.
            </p>
            <p className="mt-4 text-[16px] leading-[1.85] text-brand-neutral-800">
              Joyful Trekking Pvt. Ltd.: A child was growing up, observing and enjoying the geographical variation and the beauty it
              produced. Since childhood, he has enjoyed the chirps of birds, the howling of jackals, the gurgling of rivers, and the
              Himalayas playing hide-and-seek with clouds, and trees staying bare, sometimes, then again, bearing new leaves and fruits of
              their kind. Besides, he observed and participated in cultural programs celebrated in his multi-ethnic communities. His
              upbringing taught him to love nature and respect culture.
            </p>
          </div>

          <div data-reveal="right" className="relative aspect-[4/5] overflow-hidden rounded-[16px] shadow-[0_10px_30px_rgba(6,74,112,0.2)] min-[1000px]:aspect-[4/5]">
            <FillImage
              src="/images/gallery/everest-3.jpg"
              alt="A group of trekkers walking toward the Himalayas"
              className="absolute inset-0 size-full object-cover"
              sizes="(min-width:1000px) 480px, 100vw"
            />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-logo-sun" />
          </div>
        </div>
      </Reveal>

      <div className="bg-[#e6f3fa] py-16">
        <Reveal variant="fade-up">
          <h2 className="mb-12 px-6 text-center font-playfair-display text-[clamp(30px,4.5vw,42px)] leading-tight font-bold text-logo-navy-dark">
            Meet the <span className="text-logo-sun italic">people</span> who make it happen
          </h2>
        </Reveal>
        <TeamGrid />
      </div>
    </section>
  );
}
