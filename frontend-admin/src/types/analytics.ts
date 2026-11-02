export type AnalyticsRange = "7d" | "30d" | "90d" | "180d" | "365d";

/** Bucket size of the page views series — coarser for longer ranges. */
export type AnalyticsGranularity = "day" | "week" | "month";

export interface BrowserStat {
  browser: string;
  users: number;
}

export interface DailyPageView {
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
  configured: boolean;
  range: AnalyticsRange;
  granularity: AnalyticsGranularity;
  topBrowsers: BrowserStat[];
  dailyPageViews: DailyPageView[];
  usersByDate: UsersByDate[];
  usersByCountry: UsersByCountry[];
  usersBySource: UsersBySource[];
  topPages: TopPage[];
}
