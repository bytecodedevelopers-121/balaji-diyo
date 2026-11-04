import type { Metadata } from "next";
import { Reveal } from "@/components/animation/Reveal";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Responsible Travel",
  description:
    "Joyful Trekking's responsible travel guidelines: how we ask travelers to respect people, culture and nature, and how we give back through CSR.",
  path: "/company/responsible-travel",
});

interface Guideline {
  /** First item of a list is shown in bold, as the lead statement. */
  text: string;
  strong?: boolean;
}

const GROUPS: Array<{ title: string; items: Guideline[] }> = [
  {
    title: "Joyful Trekking Responsible Travel Guidelines",
    items: [
      { text: "Buy locally made crafts and support local skills to encourage the positive sides of tourism.", strong: true },
      { text: "Consider tipping a reasonable amount for good service." },
      { text: "Bargaining is an accepted practice in all countries we visit, but do so in good humor." },
      {
        text: "Think carefully about giving money to beggars; giving money to a local charity is often more effective in reducing reliance and expectation.",
      },
      { text: "Try not to damage any plants you see on the trail." },
      { text: "Wild animals should not be touched, fed, or disturbed, and do not encourage local people to parade animals." },
      { text: "Do not collect firewood; all the treks use kerosene for cooking." },
      { text: "Please burn all waste paper and bury it away from a water source (30m), and please use toilet facilities if they exist." },
      { text: "Our policy is to carry out all non-biodegradable rubbish; if any is left, please bring it to the guide's attention." },
      { text: "Bring along environmentally friendly detergents and shampoos, and use them as little as possible." },
      { text: "Be economical in using fresh water for showering and washing, as it is often in short supply." },
      { text: "Consider offsetting the environmental effects of international travel by contributing to Climate Care." },
    ],
  },
  {
    title: "Social Norms and Values",
    items: [
      { text: "Learn some words of the local language, which is appreciated and often results in getting more out of the experience.", strong: true },
      { text: "Ask for permission before taking photographs, out of respect for the local people." },
      { text: "Enjoy the areas you visit, but leave them in a better state than you found them." },
      { text: "Respect the local laws, customs, and cultural beliefs." },
      { text: "Observe the dress code of the area and be aware of differences in social behavior and norms." },
      { text: "Do not buy ancient artifacts or souvenirs made from endangered species." },
    ],
  },
  {
    title: "Corporate Social Responsibility (CSR)",
    items: [
      {
        text: "The tourism industry is having a highly positive impact on Nepal's rural economy. Corporate social responsibility (CSR) is gaining importance in Nepal's tourism industry.",
        strong: true,
      },
      {
        text: "As a responsible company, we at Joyful Trekking strive to promote CSR principles and practices in our tourism business. This makes the company more innovative, productive, and competitive.",
      },
      {
        text: "We at Joyful Trekking are committed to improving the lives of Nepalese low-income families and children by supporting many social organizations and individuals.",
      },
    ],
  },
];

/**
 * Responsible Travel: a wide rounded photo, breadcrumb, title and intro, then
 * the three guideline groups (responsible travel, social norms and values,
 * CSR) as bookmark-star lists, Friendship, and the closing "Come as a Guest
 * and Go as a Friend" note. Copy adapted for Joyful Trekking.
 */
export default function ResponsibleTravelPage() {
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[1100px]">
            <div data-reveal="zoom" className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(6,74,112,0.2)]">
              <FillImage
                src="/images/responsible-tourism/mountain-village.jpg"
                alt="A hillside village below the snow-capped Annapurna range"
                className="absolute inset-0 size-full object-cover"
                sizes="(min-width:1100px) 1100px, 100vw"
                preload
              />
            </div>

            <div className="mx-auto mt-5 w-full max-w-[900px]">
              <Breadcrumbs
                tone="dark"
                className="[&_ol]:justify-start"
                items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Responsible Travel" }]}
              />

              <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
                Responsible Travel
              </h1>

              <p data-reveal="up" className="mt-6 text-[16px] leading-[1.85] font-semibold text-brand-neutral-1000">
                All areas of our operations are planned with a responsible tourism policy in mind, and we require our business partners
                and clients to have an essential role in it. The following are some ideas we follow and ask you to follow:
              </p>

              {GROUPS.map((group) => (
                <div key={group.title} className="mt-9">
                  <h2 data-reveal="up" className="text-[clamp(22px,3.5vw,28px)] leading-tight font-semibold text-brand-neutral-900">
                    {group.title}
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {group.items.map((item) => (
                      <li
                        key={item.text}
                        data-reveal="up"
                        className={`relative pl-10 text-[16px] leading-[1.7] before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-[''] ${
                          item.strong ? "font-semibold text-brand-neutral-1000" : "text-brand-neutral-800"
                        }`}
                      >
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-9">
                <h2 data-reveal="up" className="text-[clamp(22px,3.5vw,28px)] leading-tight font-semibold text-brand-neutral-900">
                  Friendship
                </h2>
                <p data-reveal="up" className="mt-4 text-[16px] leading-[1.85] text-brand-neutral-800">
                  <strong className="text-brand-neutral-1000">It is great to make new friends while traveling in different parts of the world.</strong>{" "}
                  We are friendly and always happy to make new friends. So, accept and enjoy hospitality offers when you have time. Take
                  the time to chat with the locals, where you will learn about their daily lives, culture, and lifestyle.
                </p>
              </div>

              <p data-reveal="up" className="mt-8 rounded-md bg-[#fdf3d6] px-6 py-5 text-[16px] text-brand-neutral-900">
                Remember, &quot;Come as a Guest and Go as a Friend.&quot;
              </p>
            </div>
          </div>
        </section>
      </Reveal>
      <CtaSection />
    </>
  );
}
