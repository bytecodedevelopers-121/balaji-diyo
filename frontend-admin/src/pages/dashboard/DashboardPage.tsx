import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { BrowserDonutChart } from "@/components/analytics/BrowserDonutChart";
import { PageViewsLineChart } from "@/components/analytics/PageViewsLineChart";
import { RangeSelector } from "@/components/analytics/RangeSelector";
import { getRangeDescription } from "@/components/analytics/analyticsRanges";
import { useAnalyticsDashboard } from "@/hooks/queries/useAnalytics";
import { COMPANY_INFO } from "@/constants";
import { cn } from "@/utils";
import type { AnalyticsRange, UsersByDate, UsersByCountry, UsersBySource, TopPage } from "@/types/analytics";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PageCard padding="sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </PageCard>
  );
}

function withRowNumber<T>(columns: DataTableColumn<T>[]): DataTableColumn<T>[] {
  return [
    { key: "no", header: "S. No", width: "60px", render: (_row: T, index: number) => index + 1 },
    ...columns,
  ];
}

export default function DashboardPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useAnalyticsDashboard(range);
  const dashboard = data?.data;
  const rangeLabel = getRangeDescription(range);
  const granularity = dashboard?.granularity ?? "day";

  useEffect(() => {
    document.title = `Dashboard | ${COMPANY_INFO.name} Admin`;
  }, []);

  const usersByDateColumns: DataTableColumn<UsersByDate>[] = [
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "users", header: "Total Users", render: (r) => r.users },
  ];

  const usersByCountryColumns: DataTableColumn<UsersByCountry>[] = [
    { key: "country", header: "Country", render: (r) => r.country },
    { key: "users", header: "Total Users", render: (r) => r.users },
  ];

  const usersBySourceColumns: DataTableColumn<UsersBySource>[] = [
    { key: "source", header: "Source", render: (r) => r.source },
    { key: "users", header: "Total Users", render: (r) => r.users },
  ];

  const topPageColumns: DataTableColumn<TopPage>[] = [
    { key: "title", header: "Title", render: (r) => r.title },
    { key: "path", header: "Url", render: (r) => <span className="text-gray-500">{r.path}</span> },
    { key: "views", header: "Page Views", render: (r) => r.views },
  ];

  return (
    <div className={cn("space-y-6 transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isFetching}>
      <PageHeader
        title="Dashboard"
        action={
          <>
            <RangeSelector value={range} onChange={setRange} />
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
          </>
        }
      />

      {isError && <Alert variant="error" message="Failed to load analytics." />}

      {!isLoading && dashboard && !dashboard.configured && (
        <Alert
          variant="info"
          title="Google Analytics not connected"
          message="Set GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_KEY on the backend to see real traffic data here."
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={`Top Browsers (${rangeLabel})`}>
          {isLoading ? <Skeleton className="mx-auto h-64 w-64 rounded-full" /> : <BrowserDonutChart data={dashboard?.topBrowsers ?? []} />}
        </Panel>
        <Panel title={`Page Views by ${granularity} (${rangeLabel})`}>
          {isLoading ? <Skeleton className="h-64 w-full" /> : <PageViewsLineChart data={dashboard?.dailyPageViews ?? []} granularity={granularity} />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title={`Busiest Days (${rangeLabel})`}>
          <DataTable
            columns={withRowNumber(usersByDateColumns)}
            data={dashboard?.usersByDate ?? []}
            isLoading={isLoading}
            emptyMessage="No data yet."
          />
        </Panel>
        <Panel title={`Most Users By Country (${rangeLabel})`}>
          <DataTable
            columns={withRowNumber(usersByCountryColumns)}
            data={dashboard?.usersByCountry ?? []}
            isLoading={isLoading}
            emptyMessage="No data yet."
          />
        </Panel>
        <Panel title={`Users By Source (${rangeLabel})`}>
          <DataTable
            columns={withRowNumber(usersBySourceColumns)}
            data={dashboard?.usersBySource ?? []}
            isLoading={isLoading}
            emptyMessage="No data yet."
          />
        </Panel>
      </div>

      <Panel title={`Most Visited Pages (${rangeLabel})`}>
        <DataTable
          columns={withRowNumber(topPageColumns)}
          data={dashboard?.topPages ?? []}
          isLoading={isLoading}
          emptyMessage="No data yet."
        />
      </Panel>
    </div>
  );
}
