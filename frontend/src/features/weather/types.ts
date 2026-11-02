export interface PackageWeatherForecast {
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
