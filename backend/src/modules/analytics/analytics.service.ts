import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';
import { getAnalyticsClient, isAnalyticsConfigured, GA4_PROPERTY_ID } from '../../config/googleAnalytics';
import type { AnalyticsRange } from './dto';
import type {
  AnalyticsDashboard,
  AnalyticsGranularity,
  BrowserStat,
  DailyPageView,
  UsersByDate,
  UsersByCountry,
  UsersBySource,
  TopPage,
} from './types';

type RunReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;

interface RangeConfig {
  startDate: string;
  granularity: AnalyticsGranularity;
}

// 90 daily points still reads fine on the line chart; beyond that it turns
// into noise, so 6 months goes weekly and 12 months monthly.
const RANGE_CONFIG: Record<AnalyticsRange, RangeConfig> = {
  '7d': { startDate: '7daysAgo', granularity: 'day' },
  '30d': { startDate: '30daysAgo', granularity: 'day' },
  '90d': { startDate: '90daysAgo', granularity: 'day' },
  '180d': { startDate: '180daysAgo', granularity: 'week' },
  '365d': { startDate: '365daysAgo', granularity: 'month' },
};

const GRANULARITY_DIMENSION: Record<AnalyticsGranularity, string> = {
  day: 'date',
  week: 'yearWeek',
  month: 'yearMonth',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const emptyDashboard = (range: AnalyticsRange): AnalyticsDashboard => ({
  configured: false,
  range,
  granularity: RANGE_CONFIG[range].granularity,
  topBrowsers: [],
  dailyPageViews: [],
  usersByDate: [],
  usersByCountry: [],
  usersBySource: [],
  topPages: [],
});

// GA4's Data API has a daily request quota — a dashboard that gets reloaded
// often has no business hitting it on every load, so results are cached
// in-memory for a while instead.
const CACHE_TTL_MS = 10 * 60 * 1000;

// GA4 returns dates as "YYYYMMDD".
function formatGaDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(4, 6)}/${raw.slice(6, 8)}/${raw.slice(0, 4)}`;
}

// GA4 "yearWeek" is "YYYYWW", "yearMonth" is "YYYYMM".
function formatGaBucket(raw: string, granularity: AnalyticsGranularity): string {
  if (granularity === 'day') return formatGaDate(raw);

  if (granularity === 'week' && raw.length === 6) {
    return `Week ${Number(raw.slice(4, 6))}, ${raw.slice(0, 4)}`;
  }

  if (granularity === 'month' && raw.length === 6) {
    const month = MONTH_NAMES[Number(raw.slice(4, 6)) - 1];
    return month ? `${month} ${raw.slice(0, 4)}` : raw;
  }

  return raw;
}

// GA4 omits days that had no traffic, which would make the line chart draw
// straight across a quiet stretch instead of dipping to zero. Fills interior
// gaps between the first and last returned day (UTC arithmetic on the
// calendar date only, so no timezone/DST drift).
function fillDailyGaps(rows: Array<{ raw: string; views: number }>): Array<{ raw: string; views: number }> {
  if (rows.length < 2) return rows;

  const toUtc = (raw: string) => Date.UTC(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
  const toRaw = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const byDay = new Map(rows.map((r) => [r.raw, r.views]));
  const filled: Array<{ raw: string; views: number }> = [];
  const last = toUtc(rows[rows.length - 1].raw);

  for (let ms = toUtc(rows[0].raw); ms <= last; ms += 24 * 60 * 60 * 1000) {
    const raw = toRaw(ms);
    filled.push({ raw, views: byDay.get(raw) ?? 0 });
  }

  return filled;
}

export class AnalyticsService {
  // One cached result per range — each range is a different GA4 query.
  private cache = new Map<AnalyticsRange, { data: AnalyticsDashboard; expiresAt: number }>();
  // Concurrent requests for the same range (two admins, or a double-click on
  // the selector) share one round of GA4 calls instead of each firing six.
  private inFlight = new Map<AnalyticsRange, Promise<AnalyticsDashboard>>();

  async getDashboard(range: AnalyticsRange): Promise<AnalyticsDashboard> {
    if (!isAnalyticsConfigured) return emptyDashboard(range);

    const cached = this.cache.get(range);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pending = this.inFlight.get(range);
    if (pending) return pending;

    const request = this.loadDashboard(range)
      .then((data) => {
        this.cache.set(range, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        return data;
      })
      .finally(() => this.inFlight.delete(range));

    this.inFlight.set(range, request);
    return request;
  }

  private async loadDashboard(range: AnalyticsRange): Promise<AnalyticsDashboard> {
    const client = getAnalyticsClient();
    const property = `properties/${GA4_PROPERTY_ID}`;
    const { startDate, granularity } = RANGE_CONFIG[range];

    const [topBrowsers, dailyPageViews, usersByDate, usersByCountry, usersBySource, topPages] =
      await Promise.all([
        this.fetchTopBrowsers(client, property, startDate),
        this.fetchPageViewSeries(client, property, startDate, granularity),
        this.fetchUsersByDate(client, property, startDate),
        this.fetchUsersByCountry(client, property, startDate),
        this.fetchUsersBySource(client, property, startDate),
        this.fetchTopPages(client, property, startDate),
      ]);

    return {
      configured: true,
      range,
      granularity,
      topBrowsers,
      dailyPageViews,
      usersByDate,
      usersByCountry,
      usersBySource,
      topPages,
    };
  }

  private async fetchTopBrowsers(client: BetaAnalyticsDataClient, property: string, startDate: string): Promise<BrowserStat[]> {
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    };
    const [response] = await client.runReport(request);

    return (response.rows ?? []).map((row) => ({
      browser: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  }

  private async fetchPageViewSeries(
    client: BetaAnalyticsDataClient,
    property: string,
    startDate: string,
    granularity: AnalyticsGranularity,
  ): Promise<DailyPageView[]> {
    const dimension = GRANULARITY_DIMENSION[granularity];
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: dimension }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ dimension: { dimensionName: dimension } }],
    };
    const [response] = await client.runReport(request);

    const rows = (response.rows ?? []).map((row) => ({
      raw: row.dimensionValues?.[0]?.value ?? '',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    const series = granularity === 'day' ? fillDailyGaps(rows) : rows;
    return series.map(({ raw, views }) => ({ date: formatGaBucket(raw, granularity), views }));
  }

  private async fetchUsersByDate(client: BetaAnalyticsDataClient, property: string, startDate: string): Promise<UsersByDate[]> {
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    };
    const [response] = await client.runReport(request);

    return (response.rows ?? []).map((row) => ({
      date: formatGaDate(row.dimensionValues?.[0]?.value ?? ''),
      users: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  }

  private async fetchUsersByCountry(client: BetaAnalyticsDataClient, property: string, startDate: string): Promise<UsersByCountry[]> {
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    };
    const [response] = await client.runReport(request);

    return (response.rows ?? []).map((row) => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  }

  private async fetchUsersBySource(client: BetaAnalyticsDataClient, property: string, startDate: string): Promise<UsersBySource[]> {
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    };
    const [response] = await client.runReport(request);

    return (response.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  }

  private async fetchTopPages(client: BetaAnalyticsDataClient, property: string, startDate: string): Promise<TopPage[]> {
    const request: RunReportRequest = {
      property,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    };
    const [response] = await client.runReport(request);

    return (response.rows ?? []).map((row) => ({
      title: row.dimensionValues?.[0]?.value ?? 'Untitled',
      path: row.dimensionValues?.[1]?.value ?? '/',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));
  }
}
