import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPackageWeather } from '@/features/weather/api/get-package-weather';
import { WeatherForecast } from './WeatherForecast';

vi.mock('@/features/weather/api/get-package-weather', () => ({
  getPackageWeather: vi.fn(),
}));

const mockedGetPackageWeather = vi.mocked(getPackageWeather);

describe('WeatherForecast', () => {
  beforeEach(() => mockedGetPackageWeather.mockReset());

  it('renders current conditions, daily temperatures, and attribution', async () => {
    mockedGetPackageWeather.mockResolvedValue({
      location: 'Sample trek',
      latitude: 27.7172,
      longitude: 85.324,
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      attribution: { label: 'Weather data from MET Norway', url: 'https://api.met.no/' },
      current: { temperatureC: 18, relativeHumidity: 72, windSpeedKph: 9, symbolCode: 'partlycloudy_day' },
      daily: [
        {
          date: '2026-09-03',
          minC: 12,
          maxC: 20,
          precipitationMm: 1.4,
          precipitationProbability: null,
          symbolCode: 'rain',
        },
      ],
    });

    render(await WeatherForecast({ packageId: 'package-1' }));

    expect(screen.getByText('18°C')).toBeInTheDocument();
    expect(screen.getByText('20°')).toBeInTheDocument();
    expect(screen.getByText('1.4 mm')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Weather data from MET Norway' })).toHaveAttribute(
      'href',
      'https://api.met.no/',
    );
  });

  it('renders nothing when weather is not configured or temporarily unavailable', async () => {
    mockedGetPackageWeather.mockResolvedValue(null);
    const result = await WeatherForecast({ packageId: 'package-1' });
    expect(result).toBeNull();
  });
});
