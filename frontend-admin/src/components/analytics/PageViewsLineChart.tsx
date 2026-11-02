import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import type { AnalyticsGranularity, DailyPageView } from "@/types/analytics";

interface PageViewsLineChartProps {
  data: DailyPageView[];
  granularity: AnalyticsGranularity;
}

export function PageViewsLineChart({ data, granularity }: PageViewsLineChartProps) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-400">No page view data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="date" minTickGap={24} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#E2E8F0" }}
          labelFormatter={(label) => `${label}`}
          formatter={(value) => [value, `Views (per ${granularity})`]}
        />
        <Line type="monotone" dataKey="views" stroke="#4F80E1" strokeWidth={2} dot={data.length > 45 ? false : { r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
