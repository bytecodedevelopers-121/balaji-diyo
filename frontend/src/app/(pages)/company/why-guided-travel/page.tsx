import type { Metadata } from "next";
import { Reveal } from "@/components/animation/Reveal";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Guided Travel?",
  description:
    "Why travelling with a local expert guide gives you a safer, richer and worry-free holiday in Nepal, and supports the local economy.",
  path: "/company/why-guided-travel",
});

const REASONS = [
  {
    title: "To know the destination well:",
    body: (
      <>
        You can visit most places in Nepal without a guide. However, you will only look at them and take some photographs, and you will
        never know the stories behind those historical sites. The historical places in Kathmandu and other parts of Nepal have a long
        history, many stories, legends, arts and architecture, and you know them well when you take a guided tour in Nepal.{" "}
        <strong>We offer a local expert guide who interprets the destination, people, culture, lifestyle, history, geography, political
        systems, and much more.</strong> No one can interpret a destination better than the locals, so you will have authentic information
        about it.
      </>
    ),
  },
  {
    title: "To travel safely:",
    body: (
      <>
        Trekking, hiking, climbing and expeditions in Nepal go into the high Himalayas, and{" "}
        <strong>it is risky to travel alone without a guide in those remote areas.</strong> Many individual trekkers have been lost
        because some trekking trails go into high ridges, thick forest and across streams. You may lose your way in small mistakes, so{" "}
        <strong>we recommend you travel with a local guide.</strong>
      </>
    ),
  },
  {
    title: "To travel without worry:",
    body: (
      <>
        When you travel guided with us, we arrange all the related travel services from your arrival at the airport to your departure
        from Nepal. The arrangement includes airport transfers, accommodation, transport, flights, tours, guides, porters, permits,
        entrance fees, and whatever else is needed.{" "}
        <strong>You do not need to worry about anything and can enjoy your holiday to the fullest.</strong>
      </>
    ),
  },
  {
    title: "To support the local economy:",
    body: (
      <>
        When you book guided travel, it <strong>supports the local rural economy of Nepal.</strong> Nepal is facing an unemployment
        problem, and tourism is a fast-growing industry that can offer job opportunities to thousands of people. Your{" "}
        <strong>travel to Nepal can provide jobs to many people, including organizers, guides, drivers and porters.</strong> Your travel
        with us will help Nepal&apos;s local economy.
      </>
    ),
  },
];

/**
 * Why Guided Travel?: a wide rounded photo, breadcrumb, title and the case for
 * guided travel as a short intro plus four bookmark-star reasons, closing with
 * a sign-off. Copy adapted for Joyful Trekking.
 */
export default function WhyGuidedTravelPage() {
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[1100px]">
            <div data-reveal="zoom" className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(6,74,112,0.2)]">
              <FillImage
                src="/images/guided-travel/hero.jpg"
                alt="A porter carrying supplies below a snow-capped Himalayan peak"
                className="absolute inset-0 size-full object-cover"
                sizes="(min-width:1100px) 1100px, 100vw"
                preload
              />
            </div>

            <div className="mx-auto mt-5 w-full max-w-[860px]">
              <Breadcrumbs
                tone="dark"
                className="[&_ol]:justify-start"
                items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Why Guided Travel?" }]}
              />

              <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
                Why Guided Travel?
              </h1>

              <div data-reveal="up" className="mt-6 space-y-4 text-[15px] leading-[1.85] text-brand-neutral-800">
                <p className="font-semibold text-brand-neutral-1000">
                  Travelling involves visiting new places and learning about the destinations you visit. The neighbouring countries Tibet
                  and Bhutan have applied a controlled and guided tourism policy. All travellers must take guided tours, and no tourists
                  are allowed to travel solo or individually without an organized tour and guide in Tibet and Bhutan.
                </p>
                <p>
                  However, you are allowed to visit the most tourist places in Nepal (except some of the controlled areas) without a
                  guide. We at <strong className="text-brand-neutral-1000">Joyful Trekking focus on Guided Travel</strong> and here are
                  some reasons why you should take <strong className="text-brand-neutral-1000">Guided Holidays in Nepal</strong>:
                </p>
              </div>

              <ul className="mt-6 flex flex-col gap-5">
                {REASONS.map((reason) => (
                  <li
                    key={reason.title}
                    data-reveal="up"
                    className="relative pl-10 text-[15px] leading-[1.85] text-brand-neutral-800 before:absolute before:top-1 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']"
                  >
                    <strong className="text-brand-neutral-1000">{reason.title}</strong> {reason.body}
                  </li>
                ))}
              </ul>

              <p data-reveal="up" className="mt-8 text-[15px] font-semibold text-brand-neutral-1000 italic">
                Namaste, and see you soon.
              </p>
            </div>
          </div>
        </section>
      </Reveal>
      <CtaSection />
    </>
  );
}
