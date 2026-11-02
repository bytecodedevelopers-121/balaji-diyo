import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getTrekkingRegions } from "@/features/trekking-regions/api/get-trekking-regions";
import { FillImage } from "@/components/ui/FillImage";

const REGION_ORDER = [
  "everest-region-treks",
  "annapurna-region-treks",
  "langtang-region-treks",
  "restricted-area-trekking",
];

function plainText(html: string | null): string {
  if (!html) return "Explore a distinct Himalayan landscape, its mountain communities, and the journeys that make this region unforgettable.";
  const entities: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", "#39": "'", nbsp: " ",
    ldquo: '“', rdquo: '”', lsquo: "‘", rsquo: "’", ndash: "–", mdash: "—", sup2: "²",
  };
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z0-9]+|#39);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 360 ? `${text.slice(0, 357).trimEnd()}…` : text;
}

export async function TrekkingRegionsOverviewSection() {
  const regions = (await getTrekkingRegions()).sort(
    (a, b) => REGION_ORDER.indexOf(a.slug ?? "") - REGION_ORDER.indexOf(b.slug ?? ""),
  );

  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-6 pb-20 pt-14 text-center md:pb-24 md:pt-16">
        <Breadcrumbs
          tone="dark"
          items={[{ label: "Home", href: "/" }, { label: "Nepal" }, { label: "Trekking Routes In Nepal" }]}
        />
        <h1 className="mt-7 font-playfair-display text-[44px] font-medium leading-[1.1] text-brand-neutral-1000 md:text-[56px]">
          Trekking Routes in Nepal
        </h1>
        <div className="mx-auto mt-5 max-w-[1080px] space-y-6 font-poppins text-body-l leading-[1.6] text-brand-neutral-700">
          <p>Nepal is a small country in Asia, lying between India and China. Most of Nepal&apos;s borders are defined by the Himalayas, and it offers breathtaking trekking routes throughout the country. The adventure trekking routes in Nepal include Mount Everest, Manaslu, Annapurna, Upper Dolpo, and Kanchenjunga.</p>
          <p>For a more remote experience, Mount Manaslu, Upper Mustang, Upper Dolpo, and Kanchenjunga offer stunning views and rich culture. Whether you are a seasoned mountaineer or a first-time hiker, the Nepal Himalayas offer a supreme trekking experience that blends natural grandeur with deep cultural immersion.</p>
        </div>
      </section>

      <section aria-label="Trekking regions" className="mx-auto w-full max-w-[1440px]">
        {regions.map((region, index) => {
          const imageFirst = index % 2 === 0;
          const image = (
            <div className={`p-4 lg:p-8 ${imageFirst ? "lg:order-1" : "lg:order-2"}`}>
              <div className="relative h-full min-h-[358px] overflow-hidden rounded-card border border-brand-neutral-300 lg:min-h-[416px]">
                <FillImage src={region.imageUrl ?? "/images/cta/plan-your-trip.jpg"} alt={region.title} className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                <span className="absolute right-4 top-4 rounded-pill border border-white bg-black/10 px-4 py-2 font-poppins text-body-m font-medium text-white backdrop-blur-[2px] lg:right-6">
                  {String(region.packageCount).padStart(2, "0")} Itineraries
                </span>
              </div>
            </div>
          );
          const copy = (
            <div className={`flex min-h-[390px] items-center px-7 py-14 lg:min-h-[480px] lg:px-[104px] ${imageFirst ? "lg:order-2" : "lg:order-1"}`}>
              <div className="max-w-[500px]">
                <h2 className="font-poppins text-[26px] font-bold uppercase leading-[1.3] text-brand-neutral-1000">{region.title}</h2>
                <p className="mt-5 font-poppins text-body-l leading-[1.6] text-brand-neutral-700">{plainText(region.description)}</p>
                <Link href={`/${region.slug}`} className="mt-10 inline-flex items-center gap-5 font-poppins text-body-m font-semibold text-secondary-500 hover:opacity-75">
                  View Region <span aria-hidden="true" className="text-2xl">→</span>
                </Link>
              </div>
            </div>
          );
          return (
            <article key={region.id} className="grid grid-cols-1 lg:grid-cols-2">
              {image}{copy}
            </article>
          );
        })}
      </section>
    </>
  );
}
