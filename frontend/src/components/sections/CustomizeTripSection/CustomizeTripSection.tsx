import type { Trip } from "@/features/trips/types/trip.types";
import { CustomizeTripForm } from "./CustomizeTripForm";
import { FillImage } from "@/components/ui/FillImage";

interface CustomizeTripSectionProps {
  packages: Trip[];
}

export function CustomizeTripSection({ packages }: CustomizeTripSectionProps) {
  return (
    <section className="bg-brand-neutral-000">
      <div className="mx-auto grid w-full max-w-[1440px] lg:min-h-[780px] lg:grid-cols-[47.15%_52.85%]">
        <div className="relative min-h-[420px] overflow-hidden sm:min-h-[560px] lg:min-h-[780px]">
          <FillImage
            src="/images/responsible-tourism/mountain-village.jpg"
            alt="A Himalayan village beneath the snow-covered Annapurna range"
            className="absolute inset-0 size-full object-cover object-center" sizes="(min-width:1024px) 50vw, 100vw" />
        </div>

        <div className="flex items-center px-5 py-12 sm:px-10 lg:px-[42px] lg:py-16">
          <CustomizeTripForm packages={packages} />
        </div>
      </div>
    </section>
  );
}
