import { FillImage } from "@/components/ui/FillImage";
import type { PackageDetail } from "../data";
import { EmptyNote, SectionRow } from "./SectionRow";

/** Every distinct photo for the trip: the hero set plus each itinerary day's photos. */
function collectPhotos(trip: PackageDetail): string[] {
  const urls = [
    ...trip.heroImages,
    ...trip.detailedItinerary.flatMap((leg) =>
      leg.days.flatMap((day) => (day.photos ?? []).filter((media) => media.type === "image").map((media) => media.url)),
    ),
  ];
  return [...new Set(urls.filter(Boolean))];
}

/** "Media Gallery" — a photo grid for the trip. Renders nothing without photos. */
export function MediaGallerySection({ trip }: { trip: PackageDetail }) {
  const photos = collectPhotos(trip);
  if (photos.length === 0) {
    return (
      <SectionRow id="media-gallery" label="Media Gallery">
        <EmptyNote>Photos for this trip will be added soon.</EmptyNote>
      </SectionRow>
    );
  }

  return (
    <SectionRow id="media-gallery" label="Media Gallery">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((src, index) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-md bg-brand-neutral-200">
            <FillImage
              src={src}
              alt={`${trip.title} — photo ${index + 1}`}
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
          </div>
        ))}
      </div>
    </SectionRow>
  );
}
