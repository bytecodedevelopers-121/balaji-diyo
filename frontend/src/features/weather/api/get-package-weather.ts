import { apiFetch } from '@/lib/api/api-client';
import type { PackageWeatherForecast } from '../types';

export async function getPackageWeather(packageId: string): Promise<PackageWeatherForecast | null> {
  try {
    return await apiFetch<PackageWeatherForecast>(`/weather/packages/${encodeURIComponent(packageId)}`, {
      next: { revalidate: 1800, tags: [`package-weather:${packageId}`] },
      signal: AbortSignal.timeout(6500),
    });
  } catch {
    // Weather is optional supporting content. A missing coordinate, provider
    // outage, or backend timeout must never prevent the package from rendering.
    return null;
  }
}
