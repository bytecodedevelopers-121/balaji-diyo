import type { ReactNode } from "react";
import { cn } from "@/utils";

export type PageCardPadding = "sm" | "md" | "lg";

interface PageCardProps {
  children: ReactNode;
  className?: string;
  padding?: PageCardPadding;
}

const PADDING_MAP: Record<PageCardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function PageCard({ children, className, padding = "md" }: PageCardProps) {
  return (
    <div className={cn("rounded-xl border border-gray-100 bg-white shadow-sm", PADDING_MAP[padding], className)}>
      {children}
    </div>
  );
}
