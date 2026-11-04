import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Wind,
} from 'lucide-react';
import { getPackageWeather } from '@/features/weather/api/get-package-weather';

function WeatherGlyph({ symbolCode, className }: { symbolCode: string; className: string }) {
  const code = symbolCode.toLowerCase();
  if (code.includes('thunder')) return <CloudLightning className={className} aria-hidden />;
  if (code.includes('snow') || code.includes('sleet')) return <CloudSnow className={className} aria-hidden />;
  if (code.includes('rain') || code.includes('showers')) return <CloudRain className={className} aria-hidden />;
  if (code.includes('fog')) return <CloudFog className={className} aria-hidden />;
  if (code.includes('partlycloudy') || code.includes('fair')) return <CloudSun className={className} aria-hidden />;
  if (code.includes('cloudy')) return <Cloud className={className} aria-hidden />;
  return <Sun className={className} aria-hidden />;
}

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

function updatedLabel(updatedAt: string): string {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - Date.parse(updatedAt)) / 60_000));
  if (elapsedMinutes < 2) return 'Updated just now';
  if (elapsedMinutes < 60) return `Updated ${elapsedMinutes} min ago`;
  return `Updated ${Math.round(elapsedMinutes / 60)} hr ago`;
}

export async function WeatherForecast({ packageId }: { packageId: string }) {
  const forecast = await getPackageWeather(packageId);
  if (!forecast || forecast.daily.length === 0) return null;

  return (
    <div className="mt-7 border-t border-[#f4dd9a] pt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-52 items-center gap-4 lg:border-r lg:border-[#f4dd9a] lg:pr-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <WeatherGlyph symbolCode={forecast.current.symbolCode} className="size-7 text-primary-500" />
          </span>
          <div>
            <p className="font-poppins text-body-s font-medium text-brand-neutral-700">Weather near {forecast.location}</p>
            <p className="font-poppins text-3xl font-medium text-brand-neutral-1000">
              {forecast.current.temperatureC}°C
            </p>
            <p className="font-poppins text-xs font-medium text-brand-neutral-600">
              {forecast.stale ? 'Last available forecast' : updatedLabel(forecast.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-2" aria-label="Nine-day weather forecast">
          {forecast.daily.map((day, index) => {
            return (
              <div
                key={day.date}
                className="flex min-w-25 flex-1 flex-col items-center rounded-xl bg-[#fffaeb] px-3 py-3 text-center"
              >
                <p className="font-poppins text-body-s font-medium text-brand-neutral-700">{dayLabel(day.date, index)}</p>
                <WeatherGlyph symbolCode={day.symbolCode} className="my-2 size-6 text-primary-500" />
                <p className="font-poppins text-body-m font-medium text-brand-neutral-1000">
                  {day.maxC}° <span className="text-brand-neutral-600">{day.minC}°</span>
                </p>
                <span className="mt-1 flex items-center gap-1 font-poppins text-xs text-logo-navy">
                  <Droplets className="size-3" aria-hidden />
                  {day.precipitationProbability != null ? `${day.precipitationProbability}%` : `${day.precipitationMm} mm`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-poppins text-xs text-brand-neutral-600">
        <span className="flex items-center gap-3">
          {forecast.current.relativeHumidity != null ? (
            <span className="flex items-center gap-1"><Droplets className="size-3" aria-hidden /> {forecast.current.relativeHumidity}% humidity</span>
          ) : null}
          {forecast.current.windSpeedKph != null ? (
            <span className="flex items-center gap-1"><Wind className="size-3" aria-hidden /> {forecast.current.windSpeedKph} km/h</span>
          ) : null}
        </span>
        <a href={forecast.attribution.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {forecast.attribution.label}
        </a>
      </div>
      <p className="mt-2 font-poppins text-xs text-brand-neutral-500">
        Mountain weather can change quickly. Follow your guide and local safety advice.
      </p>
    </div>
  );
}
