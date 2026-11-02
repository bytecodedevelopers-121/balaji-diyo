import type { ComponentType } from "react";

export type StatCardColor =
  | "indigo"
  | "gray"
  | "blue"
  | "yellow"
  | "green"
  | "red"
  | "purple"
  | "teal"
  | "cyan"
  | "orange"
  | "emerald"
  | "rose"
  | "redDark";

interface StatCardProps {
  label: string;
  value: number;
  color: StatCardColor;
  isLoading: boolean;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
  onClick?: () => void;
}

const COLOR_MAP: Record<StatCardColor, { bg: string; border: string; text: string; iconBg: string }> = {
  indigo: { bg: "bg-indigo-50/40", border: "border-indigo-100", text: "text-indigo-700", iconBg: "bg-indigo-100/50" },
  gray: { bg: "bg-gray-50/40", border: "border-gray-100", text: "text-gray-600", iconBg: "bg-gray-100/50" },
  blue: { bg: "bg-blue-50/40", border: "border-blue-100", text: "text-blue-700", iconBg: "bg-blue-100/50" },
  yellow: { bg: "bg-yellow-50/40", border: "border-yellow-100", text: "text-yellow-700", iconBg: "bg-yellow-100/50" },
  green: { bg: "bg-green-50/40", border: "border-green-100", text: "text-green-700", iconBg: "bg-green-100/50" },
  red: { bg: "bg-red-50/40", border: "border-red-100", text: "text-red-700", iconBg: "bg-red-100/50" },
  purple: { bg: "bg-purple-50/40", border: "border-purple-100", text: "text-purple-700", iconBg: "bg-purple-100/50" },
  teal: { bg: "bg-teal-50/40", border: "border-teal-100", text: "text-teal-700", iconBg: "bg-teal-100/50" },
  cyan: { bg: "bg-cyan-50/40", border: "border-cyan-100", text: "text-cyan-700", iconBg: "bg-cyan-100/50" },
  orange: { bg: "bg-orange-50/40", border: "border-orange-100", text: "text-orange-700", iconBg: "bg-orange-100/50" },
  emerald: { bg: "bg-emerald-50/40", border: "border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100/50" },
  rose: { bg: "bg-rose-50/40", border: "border-rose-100", text: "text-rose-700", iconBg: "bg-rose-100/50" },
  redDark: { bg: "bg-red-100/40", border: "border-red-200", text: "text-red-900", iconBg: "bg-red-200/50" },
};

export function StatCard({ label, value, color, isLoading, icon: Icon, description, onClick }: StatCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.gray;
  const isClickable = !!onClick && !isLoading;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} p-4 shadow-xs backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isClickable ? "cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant/80">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-surface-container-high/60" />
          ) : (
            <p className={`text-2xl font-extrabold tracking-tight ${colors.text}`}>
              {value.toLocaleString()}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 rounded-lg p-2 ${colors.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        )}
      </div>
      {description && !isLoading && (
        <p className="mt-2 text-[10px] text-on-surface-variant/70 leading-relaxed font-medium">
          {description}
        </p>
      )}
    </div>
  );
}

