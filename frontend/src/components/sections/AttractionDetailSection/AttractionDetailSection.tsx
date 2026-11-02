import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { Container } from "@/components/ui/Container";
import type { AttractionDetail } from "@/features/attractions/types/attraction.types";
import { FillImage } from "@/components/ui/FillImage";

function mapEmbedUrl(mapValue: string | null, coordinateValue: string | null) {
  if (mapValue) {
    const iframeSrc = mapValue.match(/src=["']([^"']+)["']/i)?.[1];
    const candidate = (iframeSrc ?? mapValue).replaceAll("&amp;", "&").trim();
    if (candidate.startsWith("https://") || candidate.startsWith("http://")) return candidate;
  }

  if (!coordinateValue) return null;
  const [lat, lng] = coordinateValue.split(",").map((part) => Number(part.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const offset = 0.025;
  const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function AttractionDetailSection({ attraction }: { attraction: AttractionDetail }) {
  const primaryRegion = attraction.regions.find((region) => region.isPrimary)?.category ?? attraction.regions[0]?.category;
  const fallbackFacts = [
    attraction.placeElevation ? { id: "elevation", label: "Elevation", value: attraction.placeElevation, sortOrder: 0 } : null,
    attraction.placeCoordinates ? { id: "coordinates", label: "Coordinates", value: attraction.placeCoordinates, sortOrder: 1 } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);
  const facts = attraction.facts.length ? attraction.facts : fallbackFacts;
  const galleryImages = attraction.galleryImages ?? [];
  const locationMapUrl = mapEmbedUrl(attraction.placeMap, attraction.placeCoordinates);
  const routeMap = attraction.routeMap;
  const routeMapHref = routeMap ? `/map/${routeMap.slug}` : "";

  return (
    <>
      <section className={`relative flex min-h-[520px] items-end overflow-hidden py-10 sm:min-h-[640px] ${attraction.imageUrl ? "" : "bg-primary-100"}`}>
        {attraction.imageUrl ? (
          <>
            <FillImage src={attraction.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover" sizes="100vw" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : null}
        <Container className="max-w-5xl">
          <Breadcrumbs tone={attraction.imageUrl ? "light" : "dark"} items={[{ label: "Home", href: "/" }, { label: "Attractions", href: "/attractions" }, { label: attraction.placeName }]} />
          <div className="mx-auto mt-4 max-w-4xl text-center">
            {primaryRegion ? <p className={`font-poppins text-body-m font-bold uppercase tracking-[0.16em] ${attraction.imageUrl ? "text-primary-200" : "text-primary-700"}`}>{primaryRegion.title}</p> : null}
            <h1 className={`mt-2 text-balance font-playfair-display text-[44px] leading-[1.08] font-medium sm:text-[64px] ${attraction.imageUrl ? "text-white drop-shadow-sm" : "text-brand-neutral-1000"}`}>{attraction.placeName}</h1>
            {attraction.placeAbstract ? <p className={`mx-auto mt-5 max-w-3xl font-poppins text-body-l ${attraction.imageUrl ? "text-white/90 drop-shadow-sm" : "text-brand-neutral-800"}`}>{attraction.placeAbstract}</p> : null}
          </div>
        </Container>
      </section>

      <section className="bg-white pb-20">
        <Container className="max-w-5xl">
          {facts.length ? (
            <div className="mb-12 overflow-hidden rounded-card border border-brand-neutral-300">
              <div className="bg-primary-100 px-5 py-3 font-poppins text-body-m font-bold text-primary-900">Quick information</div>
              <dl className="divide-y divide-brand-neutral-300">
                {facts.map((fact) => (
                  <div key={fact.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[220px_1fr]">
                    <dt className="font-poppins text-body-m font-semibold text-brand-neutral-1000">{fact.label}</dt>
                    <dd className="font-poppins text-body-m text-brand-neutral-800">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {attraction.placeDescription ? <CmsProse html={attraction.placeDescription} /> : <p className="font-poppins text-body-l text-brand-neutral-700">More information about this attraction is coming soon.</p>}

          {galleryImages.length ? (
            <section className="mt-16 border-t border-brand-neutral-300 pt-10">
              <h2 className="font-playfair-display text-[34px] font-medium text-brand-neutral-1000">Gallery</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {galleryImages.map((image, index) => (
                  <figure
                    key={image.id}
                    className={`overflow-hidden rounded-card bg-brand-neutral-100 ${index === 0 && galleryImages.length % 2 === 1 ? "sm:col-span-2" : ""}`}
                  >
                    <div className={index === 0 && galleryImages.length % 2 === 1 ? "relative aspect-[16/8]" : "relative aspect-[4/3]"}>
                      <FillImage src={image.url} alt={image.altText || `${attraction.placeName} gallery image`} className="size-full object-cover" sizes="100vw" />
                    </div>
                    {image.caption ? <figcaption className="px-4 py-3 font-poppins text-body-m text-brand-neutral-700">{image.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {locationMapUrl ? (
            <section className="mt-16 border-t border-brand-neutral-300 pt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-playfair-display text-[34px] font-medium text-brand-neutral-1000">Location</h2>
                  {attraction.placeCoordinates ? <p className="mt-1 font-poppins text-body-m text-brand-neutral-700">{attraction.placeCoordinates}</p> : null}
                </div>
                {routeMap ? (
                  <Link href={routeMapHref} className="font-poppins text-body-m font-semibold text-primary-700 hover:text-primary-900">View trekking route map →</Link>
                ) : attraction.placeCoordinates ? (
                  <a href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(attraction.placeCoordinates.split(",")[0]?.trim() ?? "")}&mlon=${encodeURIComponent(attraction.placeCoordinates.split(",")[1]?.trim() ?? "")}`} target="_blank" rel="noreferrer" className="font-poppins text-body-m font-semibold text-primary-700 hover:text-primary-900">Open larger map ↗</a>
                ) : null}
              </div>
              <div className="relative mt-6 overflow-hidden rounded-card border border-brand-neutral-300 bg-brand-neutral-100">
                {/* An iframe swallows clicks and its own "larger map" links leave the site, so when a trekking route
                    is linked the embed is made inert and a full-cover internal link sits on top of it instead. */}
                <iframe src={locationMapUrl} title={`Map showing ${attraction.placeName}`} loading="lazy" className={`h-[420px] w-full border-0 ${routeMap ? "pointer-events-none" : ""}`} referrerPolicy="no-referrer-when-downgrade" tabIndex={routeMap ? -1 : undefined} />
                {routeMap ? (
                  <Link href={routeMapHref} aria-label={`View the ${routeMap.mapTitle} trekking route map`} className="group absolute inset-0 flex items-end justify-center bg-transparent p-5 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-700">
                    <span className="rounded-full bg-white/95 px-4 py-2 font-poppins text-body-m font-semibold text-primary-900 shadow-md transition-colors group-hover:bg-primary-100">View {routeMap.mapTitle} →</span>
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}

          {attraction.packages.length ? (
            <section className="mt-16 border-t border-brand-neutral-300 pt-10">
              <h2 className="font-playfair-display text-[34px] font-medium text-brand-neutral-1000">Treks that visit {attraction.placeName}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {attraction.packages.map((trip) => {
                  const card = (
                    <>
                      <h3 className="font-playfair-display text-[22px] font-medium text-brand-neutral-1000">{trip.title}</h3>
                      <p className="mt-2 font-poppins text-body-m text-brand-neutral-700">{trip.duration} {trip.durationType}</p>
                    </>
                  );
                  return trip.slug ? <Link key={trip.id} href={`/${trip.slug}`} className="rounded-card bg-brand-neutral-100 p-5 transition-colors hover:bg-primary-100">{card}</Link> : <article key={trip.id} className="rounded-card bg-brand-neutral-100 p-5">{card}</article>;
                })}
              </div>
            </section>
          ) : null}

          {attraction.blogs.length ? (
            <section className="mt-14 border-t border-brand-neutral-300 pt-10">
              <h2 className="font-playfair-display text-[34px] font-medium text-brand-neutral-1000">Stories and advice</h2>
              <div className="mt-5 flex flex-col divide-y divide-brand-neutral-300">
                {attraction.blogs.map((blog) => blog.slug ? <Link key={blog.id} href={`/blog/${blog.slug}`} className="py-4 font-poppins text-body-l font-semibold text-primary-700 hover:text-primary-900">{blog.title} →</Link> : null)}
              </div>
            </section>
          ) : null}
        </Container>
      </section>
    </>
  );
}
