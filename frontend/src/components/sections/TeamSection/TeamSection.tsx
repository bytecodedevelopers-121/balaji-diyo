import { TeamGrid } from "./TeamGrid";

/**
 * "Our Team" — the /team page's main section, transcribed from
 * design-references/our-team.png (y≈590–2470 at 1440px) and
 * design-references/ourteamcss/team.txt ("our team section": 16px
 * Poppins/500 body copy centered, 44px top/bottom padding, 56px gap).
 *
 * White background — the black bg read off the screenshot (and the
 * matching low-contrast "ghost" heading/name treatment it produced) was
 * removed per direct user feedback (2026-08-19), same "the black
 * background doesn't exist in the real design" correction
 * AboutUsIntroSection's own comment documents for its section. Heading
 * and body copy now use the same dark-on-white palette as
 * AboutUsIntroSection's "About Us" intro.
 */
export function TeamSection() {
  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1442px] flex-col items-center gap-6 px-6 text-center md:px-16">
        <h2 className="font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          Our Team
        </h2>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          As pioneers in Nepali tourism, we have felt the pulse and rhythm of
          the country with every virgin trail we&apos;ve walked, every nook
          and cranny we&apos;ve traversed, and every new face that has smiled
          at us. We know every bump on the road, every bloodstain in our
          history and the slightest gesture in our culture. Believe us when
          we say that we single-handedly bring more to the table than the
          entire travel industry set up in Thamel.
        </p>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          Joyful Trekking Pvt. Ltd.: A child was growing up, observing and
          enjoying the geographical variation and the beauty it produced.
          Since childhood, he has enjoyed the chirps of birds, the howling of
          jackals, the gurgling of rivers, and the Himalayas playing
          hide-and-seek with clouds, and trees staying bare, sometimes, then
          again, bearing new leaves and fruits of their kind. Besides, he
          observed and participated in cultural programs celebrated in his
          multi-ethnic communities. His upbringing taught him to love nature
          and respect culture.
        </p>
      </div>

      <div className="mt-14">
        <TeamGrid />
      </div>
    </section>
  );
}
