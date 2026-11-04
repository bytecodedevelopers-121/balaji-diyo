import { Compass, Flag, Footprints } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";

const MILESTONES = [
  {
    year: "1992 – 2008",
    title: "Guiding the Himalayas",
    icon: Footprints,
    image: "/images/gallery/everest-4.jpg",
    alt: "Two trekkers on a green mountain slope",
    paragraphs: [
      "Dambar Khadka, who would go on to found Joyful Trekking Pvt. Ltd., spent these years leading trekkers through the Himalayas as a guide for an established trekking company, building the on-the-ground experience in Nepal's trails, terrain, and local customs the company still runs on today.",
    ],
  },
  {
    year: "2008 – 2010",
    title: "Working Independently",
    icon: Compass,
    image: "/images/hero/hero-4.jpeg",
    alt: "Ama Dablam rising above a ridge",
    paragraphs: [
      "He struck out on his own as a freelance guide, continuing to lead trips through Nepal while building the relationships and reputation that would soon become the foundation of his own company.",
    ],
  },
  {
    year: "2010 – Present",
    title: "Founding Joyful Trekking Pvt. Ltd.",
    icon: Flag,
    image: "/images/cta/gokyo-lake-yak-wide.jpg",
    alt: "Gokyo lake and the Himalayas",
    paragraphs: [
      "Drawing on nearly two decades in the field, Dambar Khadka founded Joyful Trekking Pvt. Ltd. with a team of fellow field experts, turning that guiding and freelance experience into a company focused on the traveler's satisfaction.",
      "The company built early partnerships with hotels including Yak & Yeti, Annapurna, Shangri-La, and Malla, and grew its team of field staff and tour leaders. Starting from a small space with three countries as trip destinations, it has continued expanding its reach ever since.",
    ],
  },
];

/**
 * "Our History": three real milestones from the company's own story, drawn as
 * alternating photo-and-text rows along a dashed trail in the logo colours.
 * The dates and copy are the same as before (see the About Us page's earlier
 * notes on the 1992 / 2008 / 2010 timeline); only the layout and photos changed.
 */
export function HistorySection() {
  return (
    <section className="bg-[#e6f3fa] px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <h2 data-reveal="up" className="text-center font-playfair-display text-[clamp(34px,5vw,48px)] leading-[1.15] font-bold text-logo-navy-dark">
          Our <span className="text-logo-sun italic">History</span>
        </h2>

        <ol className="relative mt-14 flex flex-col gap-14 min-[900px]:gap-20">
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-1/2 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-logo-navy/30 min-[900px]:block"
          />
          {MILESTONES.map((milestone, index) => {
            const Icon = milestone.icon;
            const reversed = index % 2 === 1;
            return (
              <li key={milestone.year} className="relative grid items-center gap-6 min-[900px]:grid-cols-2 min-[900px]:gap-20">
                <span
                  aria-hidden="true"
                  data-reveal="zoom"
                  className="absolute top-1/2 left-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-logo-sun text-logo-navy-dark shadow-[0_0_0_6px_#e6f3fa] min-[900px]:grid"
                >
                  <Icon className="size-5" />
                </span>

                <div data-reveal={reversed ? "right" : "left"} className={`relative aspect-[16/10] overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(6,74,112,0.2)] ${reversed ? "min-[900px]:order-2" : ""}`}>
                  <FillImage src={milestone.image} alt={milestone.alt} className="absolute inset-0 size-full object-cover" sizes="(min-width:900px) 520px, 100vw" />
                </div>

                <div data-reveal={reversed ? "left" : "right"} className={`rounded-[14px] bg-white p-7 shadow-[0_6px_24px_rgba(6,74,112,0.12)] ${reversed ? "min-[900px]:order-1" : ""}`}>
                  <p className="inline-block rounded-pill bg-logo-sun px-4 py-1 text-[13px] font-bold text-logo-navy-dark">{milestone.year}</p>
                  <h3 className="mt-4 font-playfair-display text-[26px] leading-tight font-bold text-logo-navy-dark">{milestone.title}</h3>
                  {milestone.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-[16px] leading-[1.8] text-brand-neutral-800">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
