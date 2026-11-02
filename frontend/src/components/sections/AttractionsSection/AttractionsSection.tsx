import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { Container } from "@/components/ui/Container";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import type { AttractionIndex, AttractionSummary } from "@/features/attractions/types/attraction.types";
import type { CmsPage } from "@/features/pages/types/cms-page.types";
import { FillImage } from "@/components/ui/FillImage";

const attractionKinds = [
  ["Towns and Villages", "Meet mountain communities where local culture, welcoming lodges and trail life shape the journey."],
  ["Scenic Viewpoints", "Rise above the trail for sweeping Himalayan panoramas and memorable sunrise views."],
  ["Hidden Valleys", "Follow quieter paths through remote landscapes and remarkably preserved mountain scenery."],
  ["Alpine Lakes", "Discover clear high-altitude lakes framed by glaciers, ridges and snow-covered peaks."],
  ["Spiritual Stops", "Pause at monasteries, temples and sacred landscapes woven into Nepal's living traditions."],
  ["Along the Trail", "Cross passes, rivers and suspension bridges that make each day of a trek distinctive."],
] as const;

function AttractionCard({ place }: { place: AttractionSummary }) {
  const content = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-primary-100">
        {place.imageUrl ? (
          <FillImage src={place.imageUrl} alt={place.placeName} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#c4edfd,#056d94)]" aria-hidden="true" />
        )}
        {place.placeType ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-poppins text-body-s font-semibold text-primary-700">
            {place.placeType.title}
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <h3 className="font-playfair-display text-[24px] leading-tight font-medium text-brand-neutral-1000">{place.placeName}</h3>
        {place.placeAbstract ? <p className="mt-2 line-clamp-3 font-poppins text-body-m text-brand-neutral-800">{place.placeAbstract}</p> : null}
        <span className="mt-4 inline-flex font-poppins text-body-m font-semibold text-primary-600">Explore attraction →</span>
      </div>
    </>
  );

  return place.slug ? (
    <Link href={`/attractions/${place.slug}`} className="group overflow-hidden rounded-card bg-white shadow-card-soft transition-transform hover:-translate-y-1">
      {content}
    </Link>
  ) : (
    <article className="group overflow-hidden rounded-card bg-white shadow-card-soft">{content}</article>
  );
}

export function AttractionsSection({ data, page }: { data: AttractionIndex; page: CmsPage | null }) {
  return (
    <>
      <section className="relative flex min-h-[560px] items-center overflow-hidden py-20 sm:min-h-[680px]">
        <Image
          src="/images/attractions/hero.webp"
          alt="A Himalayan trekking village and mountain trail in Nepal"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <Container className="max-w-5xl text-center">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Attractions" }]} />
          <h1 className="mt-7 text-balance font-playfair-display text-[44px] leading-[1.08] font-medium text-white drop-shadow-sm sm:text-[64px]">
            {page?.title ?? "Discover Nepal's Top Trekking Attractions"}
          </h1>
          {page?.content ? (
            <CmsProse html={normalizeCmsHtml(page.content)} className="mx-auto mt-6 max-w-3xl text-left text-white [&_p]:text-white sm:text-center" />
          ) : (
            <div className="mx-auto mt-6 max-w-3xl space-y-4 font-poppins text-body-l text-white/90 drop-shadow-sm">
              <p>Nepal&apos;s trekking routes connect remarkable mountain villages, viewpoints, valleys, lakes and sacred places.</p>
              <p>Explore the landmarks that give every region its own character and turn each day on the trail into part of the adventure.</p>
            </div>
          )}
        </Container>
      </section>

      <section className="bg-brand-neutral-100 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-playfair-display text-[36px] leading-tight font-medium text-brand-neutral-1000 sm:text-[44px]">Must-See Attractions</h2>
            <p className="mt-3 font-poppins text-body-l text-brand-neutral-800">The places and experiences that define Nepal&apos;s best-loved trekking regions.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {attractionKinds.map(([title, description], index) => (
              <article key={title} className="rounded-card border border-brand-neutral-300 bg-white p-6 shadow-card-soft">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-100 font-poppins text-body-m font-bold text-primary-700">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-playfair-display text-[24px] font-medium text-brand-neutral-1000">{title}</h3>
                <p className="mt-2 font-poppins text-body-m text-brand-neutral-800">{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="max-w-2xl">
            <p className="font-poppins text-body-m font-bold uppercase tracking-[0.16em] text-primary-600">Find your next stop</p>
            <h2 className="mt-2 font-playfair-display text-[38px] leading-tight font-medium text-brand-neutral-1000 sm:text-[48px]">Explore Attractions by Region</h2>
          </div>

          {data.regions.length ? (
            <div className="mt-12 space-y-16">
              {data.regions.map((region) => (
                <section key={region.id} id={region.title.toLowerCase().replaceAll(" ", "-")} className="scroll-mt-8">
                  <div className="flex items-end justify-between gap-6 border-b border-brand-neutral-300 pb-4">
                    <h3 className="font-playfair-display text-[30px] font-medium text-brand-neutral-1000 sm:text-[36px]">{region.title} Attractions</h3>
                    <span className="shrink-0 font-poppins text-body-m text-brand-neutral-700">{region.places.length} places</span>
                  </div>
                  <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {region.places.map((place) => <AttractionCard key={`${region.id}-${place.id}`} place={place} />)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-card bg-brand-neutral-100 p-8 text-center font-poppins text-body-l text-brand-neutral-700">Attractions are being prepared. Check back soon.</p>
          )}
        </Container>
      </section>
    </>
  );
}
