import type { AnalyticsRange } from './dto';

/** How the daily page views series is bucketed — coarser for longer ranges so the chart stays readable. */
export type AnalyticsGranularity = 'day' | 'week' | 'month';

export interface BrowserStat {
  browser: string;
  users: number;
}

export interface DailyPageView {
  /** Display label for the bucket: "MM/DD/YYYY" (day), "Week 12, 2026" (week) or "Mar 2026" (month). */
  date: string;
  views: number;
}

export interface UsersByDate {
  date: string;
  users: number;
}

export interface UsersByCountry {
  country: string;
  users: number;
}

export interface UsersBySource {
  source: string;
  users: number;
}

export interface TopPage {
  title: string;
  path: string;
  views: number;
}

export interface AnalyticsDashboard {
  /** false when GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_KEY aren't set — every list is empty in that case. */
  configured: boolean;
  range: AnalyticsRange;
  /** Bucket size of `dailyPageViews`. */
  granularity: AnalyticsGranularity;
  topBrowsers: BrowserStat[];
  dailyPageViews: DailyPageView[];
  usersByDate: UsersByDate[];
  usersByCountry: UsersByCountry[];
  usersBySource: UsersBySource[];
  topPages: TopPage[];
}
