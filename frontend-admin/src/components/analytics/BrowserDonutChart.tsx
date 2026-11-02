import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { BrowserStat } from "@/types/analytics";

const COLORS = ["#4F80E1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#64748B"];

interface BrowserDonutChartProps {
  data: BrowserStat[];
}

export function BrowserDonutChart({ data }: BrowserDonutChartProps) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-400">No browser data yet.</p>;
  }

  const top = data[0];

  return (
    <div className="relative mx-auto h-64 w-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="users"
            nameKey="browser"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={1}
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={entry.browser} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, _name, item) => [value, item.payload.browser]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-gray-900">{top.browser}</p>
        <p className="text-sm text-gray-500">{top.users}</p>
      </div>
    </div>
  );
}
