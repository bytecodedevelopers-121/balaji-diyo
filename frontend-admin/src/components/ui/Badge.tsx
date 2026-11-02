import { cn } from "@/utils";

export type BadgeVariant =
  | "green"
  | "red"
  | "yellow"
  | "gray"
  | "blue"
  | "orange"
  | "purple"
  | "teal"
  | "cyan"
  | "rose"
  | "indigo";

export type BadgeSize = "sm" | "md";

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: BadgeSize;
}

const COLOR_MAP: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  teal: "bg-teal-100 text-teal-700",
  cyan: "bg-cyan-100 text-cyan-700",
  rose: "bg-rose-100 text-rose-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

const SIZE_MAP: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

export function Badge({ label, variant, size = "md" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        COLOR_MAP[variant],
        SIZE_MAP[size],
      )}
    >
      {label}
    </span>
  );
}
