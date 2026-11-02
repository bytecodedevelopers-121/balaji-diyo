import { z } from 'zod';
import { ApiError } from '../../common/exceptions/api-error';
import { WeatherRepository } from './weather.repository';

const MET_ENDPOINT = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const DEFAULT_USER_AGENT = 'BoundlessAdventure/1.0 https://boundlessadventure.com';
const FALLBACK_CACHE_MS = 30 * 60 * 1000;
const STALE_CACHE_MS = 6 * 60 * 60 * 1000;

const periodSchema = z.object({
  summary: z.object({ symbol_code: z.string() }),
  details: z.object({
    precipitation_amount: z.number().optional(),
    probability_of_precipitation: z.number().optional(),
  }).passthrough(),
});

const metResponseSchema = z.object({
  properties: z.object({
    meta: z.object({ updated_at: z.string() }),
    timeseries: z.array(z.object({
      time: z.string(),
      data: z.object({
        instant: z.object({
          details: z.object({
            air_temperature: z.number(),
            relative_humidity: z.number().optional(),
            wind_speed: z.number().optional(),
          }).passthrough(),
        }),
        next_1_hours: periodSchema.optional(),
        next_6_hours: periodSchema.optional(),
        next_12_hours: periodSchema.optional(),
      }),
    })),
  }),
});

interface CachedForecast {
  value: WeatherForecast;
  expiresAtMs: number;
  staleUntilMs: number;
  lastModified?: string;
}

interface DailyAccumulator {
  date: string;
  temperatures: number[];
  precipitationMm: number;
  precipitationProbability: number;
  hasPrecipitationProbability: boolean;
  symbolCode: string;
  symbolDistanceFromNoon: number;
}

export interface WeatherForecast {
  location: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  expiresAt: string;
  attribution: { label: string; url: string };
  current: {
    temperatureC: number;
    relativeHumidity: number | null;
    windSpeedKph: number | null;
    symbolCode: string;
  };
  daily: Array<{
    date: string;
    minC: number;
    maxC: number;
    precipitationMm: number;
    precipitationProbability: number | null;
    symbolCode: string;
  }>;
  stale?: boolean;
}

const cache = new Map<string, CachedForecast>();

function parseCoordinate(value: string | null, minimum: number, maximum: number): number | null {
  if (!value) return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function parseCoordinatePair(value: string | null): { latitude: number; longitude: number } | null {
  if (!value) return null;
  const [latitudeValue, longitudeValue, ...extra] = value.split(',');
  if (extra.length > 0) return null;
  const latitude = parseCoordinate(latitudeValue ?? null, -90, 90);
  const longitude = parseCoordinate(longitudeValue ?? null, -180, 180);
  return latitude == null || longitude == null ? null : { latitude, longitude };
}

function parseElevation(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const elevation = Math.round(Number(match[0]));
  return Number.isFinite(elevation) && elevation >= -500 && elevation <= 9000 ? elevation : null;
}

type PackageLocation = Awaited<ReturnType<WeatherRepository['findPackageLocation']>>;

function resolveForecastPoint(pkg: NonNullable<PackageLocation>) {
  const packageLatitude = parseCoordinate(pkg.geoLatitude, -90, 90);
  const packageLongitude = parseCoordinate(pkg.geoLongitude, -180, 180);
  if (packageLatitude != null && packageLongitude != null) {
    return { latitude: packageLatitude, longitude: packageLongitude, elevation: null, label: pkg.title };
  }

  const candidates = (pkg.itinerary?.details ?? []).flatMap((detail) => [
    {
      coordinate: parseCoordinatePair(detail.destinationCoordinate),
      elevation: parseElevation(detail.destinationElevation),
      label: detail.destination || detail.itineraryTitle || pkg.title,
    },
    {
      coordinate: parseCoordinatePair(detail.originCoordinate),
      elevation: parseElevation(detail.originElevation),
      label: detail.origin || detail.itineraryTitle || pkg.title,
    },
  ]).filter((candidate) => candidate.coordinate != null);

  // One representative package forecast, not one request per itinerary day.
  // The highest authored route stop is the most safety-relevant point and its
  // paired elevation can be supplied without confusing it with maxAltitude.
  candidates.sort((a, b) => (b.elevation ?? -501) - (a.elevation ?? -501));
  const selected = candidates[0];
  return selected?.coordinate
    ? { ...selected.coordinate, elevation: selected.elevation, label: selected.label }
    : null;
}

function localDateParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}

function preferredPeriod(data: z.infer<typeof metResponseSchema>['properties']['timeseries'][number]['data']) {
  return data.next_1_hours ?? data.next_6_hours ?? data.next_12_hours;
}

function normalizeForecast(
  raw: z.infer<typeof metResponseSchema>,
  location: string,
  latitude: number,
  longitude: number,
  expiresAt: string,
): WeatherForecast {
  const first = raw.properties.timeseries[0];
  if (!first) throw new ApiError(502, 'Weather provider returned an empty forecast');

  const daily = new Map<string, DailyAccumulator>();
  for (const point of raw.properties.timeseries) {
    const { date, hour } = localDateParts(point.time);
    const period = preferredPeriod(point.data);
    const existing = daily.get(date) ?? {
      date,
      temperatures: [],
      precipitationMm: 0,
      precipitationProbability: 0,
      hasPrecipitationProbability: false,
      symbolCode: period?.summary.symbol_code ?? 'cloudy',
      symbolDistanceFromNoon: Number.POSITIVE_INFINITY,
    };

    existing.temperatures.push(point.data.instant.details.air_temperature);
    if (period?.details.probability_of_precipitation != null) {
      existing.hasPrecipitationProbability = true;
      existing.precipitationProbability = Math.max(
        existing.precipitationProbability,
        period.details.probability_of_precipitation,
      );
    }
    // MET changes from hourly to six-hourly periods later in the forecast.
    // Prefer the non-overlapping one-hour bucket when present, then six-hour.
    existing.precipitationMm +=
      point.data.next_1_hours?.details.precipitation_amount ??
      point.data.next_6_hours?.details.precipitation_amount ??
      0;

    const distanceFromNoon = Math.abs(hour - 12);
    if (period && distanceFromNoon < existing.symbolDistanceFromNoon) {
      existing.symbolCode = period.summary.symbol_code;
      existing.symbolDistanceFromNoon = distanceFromNoon;
    }
    daily.set(date, existing);
  }

  const details = first.data.instant.details;
  return {
    location,
    latitude,
    longitude,
    updatedAt: raw.properties.meta.updated_at,
    expiresAt,
    attribution: { label: 'Weather data from MET Norway', url: 'https://api.met.no/' },
    current: {
      temperatureC: Math.round(details.air_temperature),
      relativeHumidity: details.relative_humidity == null ? null : Math.round(details.relative_humidity),
      windSpeedKph: details.wind_speed == null ? null : Math.round(details.wind_speed * 3.6),
      symbolCode: preferredPeriod(first.data)?.summary.symbol_code ?? 'cloudy',
    },
    daily: [...daily.values()].slice(0, 9).map((day) => ({
      date: day.date,
      minC: Math.round(Math.min(...day.temperatures)),
      maxC: Math.round(Math.max(...day.temperatures)),
      precipitationMm: Math.round(day.precipitationMm * 10) / 10,
      precipitationProbability: day.hasPrecipitationProbability ? Math.round(day.precipitationProbability) : null,
      symbolCode: day.symbolCode,
    })),
  };
}

function expiryFromHeader(value: string | null): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > Date.now() ? parsed : Date.now() + FALLBACK_CACHE_MS;
}

export class WeatherService {
  constructor(private repository: WeatherRepository) {}

  async getPackageForecast(packageId: string): Promise<WeatherForecast> {
    const pkg = await this.repository.findPackageLocation(packageId);
    if (!pkg) throw new ApiError(404, 'Package not found');

    const point = resolveForecastPoint(pkg);
    if (!point) {
      throw new ApiError(404, 'Weather is not configured for this package');
    }

    const roundedLatitude = Number(point.latitude.toFixed(4));
    const roundedLongitude = Number(point.longitude.toFixed(4));
    const key = `${packageId}:${roundedLatitude}:${roundedLongitude}:${point.elevation ?? 'auto'}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAtMs > Date.now()) return cached.value;

    const params = new URLSearchParams({
      lat: String(roundedLatitude),
      lon: String(roundedLongitude),
    });
    if (point.elevation != null) params.set('altitude', String(point.elevation));

    try {
      const response = await fetch(`${MET_ENDPOINT}?${params}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'User-Agent': process.env.MET_WEATHER_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
          ...(cached?.lastModified ? { 'If-Modified-Since': cached.lastModified } : {}),
        },
        signal: AbortSignal.timeout(5000),
      });

      const expiresAtMs = expiryFromHeader(response.headers.get('expires'));
      if (response.status === 304 && cached) {
        cached.expiresAtMs = expiresAtMs;
        cached.staleUntilMs = expiresAtMs + STALE_CACHE_MS;
        cached.value = { ...cached.value, expiresAt: new Date(expiresAtMs).toISOString() };
        return cached.value;
      }
      if (!response.ok) throw new Error(`MET Norway responded with ${response.status}`);

      const parsed = metResponseSchema.parse(await response.json());
      const value = normalizeForecast(
        parsed,
        point.label,
        roundedLatitude,
        roundedLongitude,
        new Date(expiresAtMs).toISOString(),
      );
      if (cache.size >= 500) cache.delete(cache.keys().next().value ?? '');
      cache.set(key, {
        value,
        expiresAtMs,
        staleUntilMs: expiresAtMs + STALE_CACHE_MS,
        lastModified: response.headers.get('last-modified') ?? undefined,
      });
      return value;
    } catch (error) {
      if (cached && cached.staleUntilMs > Date.now()) return { ...cached.value, stale: true };
      throw new ApiError(503, 'Weather forecast is temporarily unavailable');
    }
  }
}
