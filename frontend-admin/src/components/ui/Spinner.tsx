import { cn } from "@/utils";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerColor = "white" | "indigo" | "gray";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const COLOR_MAP: Record<SpinnerColor, string> = {
  white: "text-white",
  indigo: "text-indigo-600",
  gray: "text-gray-400",
};

export function Spinner({ size = "md", color = "indigo" }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", SIZE_MAP[size], COLOR_MAP[color])}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
